import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import UbicacionCascada from "../components/UbicacionCascada";
import "../App.css";
import { registrar, ACCIONES } from "../services/auditoria";

// IDs de metodo_pago en la base de datos
const METODO_TARJETA = 1;
const METODO_SINPE = 2;
const METODO_EFECTIVO = 3;
const METODO_PAYPAL = 4;

// Client ID público de PayPal (sandbox) — es seguro exponerlo en el frontend,
// el Secret nunca sale del backend.
const PAYPAL_CLIENT_ID = "ASKtz-IpCSezxAgKBy5n_J_dwCX-voArOZAsSUL8I94JA_mxhZMMngkqx1qo-CuWJmS_Cgz1na-H0wSY";

// Tasa de respaldo por si el BCCR no responde (fin de semana, feriado, o falla de red)
const TASA_CAMBIO_USD_RESPALDO = 520;

// En producción (Vercel) usa la URL real del backend; en desarrollo local, localhost
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";

function Pedido() {
  const navigate = useNavigate();
  const [cliente, setCliente] = useState(null);
  useEffect(() => { registrar(ACCIONES.VER_HISTORIAL_PEDIDOS); }, []);
  const [carrito, setCarrito] = useState(() => {
    // Leer localStorage en el momento exacto que se crea el componente
    try {
      return JSON.parse(localStorage.getItem("carrito")) || [];
    } catch {
      return [];
    }
  });
  const [metodoPagoId, setMetodoPagoId] = useState(METODO_SINPE);
  const [direccion, setDireccion] = useState("");
  const [ubicacion, setUbicacion] = useState({
    idPais: "", idProvincia: "", idCanton: "", idDistrito: ""
  });
  const [recibo, setRecibo] = useState(null);
  const [enviando, setEnviando] = useState(false);

  // ── Tipo de cambio del BCCR (nueva funcionalidad) ──────────────────────
  const [tipoCambioBCCR, setTipoCambioBCCR] = useState(null);

  useEffect(() => {
    fetch(`${API_BASE}/bccr/tipo-cambio-compra`)
      .then((r) => r.json())
      .then((d) => {
        if (d.valor) setTipoCambioBCCR(d);
      })
      .catch(() => {
        // Si falla, se usa la tasa de respaldo silenciosamente (no interrumpe la compra)
      });
  }, []);

  const tasaCambioActual = tipoCambioBCCR?.valor || TASA_CAMBIO_USD_RESPALDO;

  // ── Datos de pago (nueva funcionalidad) ────────────────────────────────
  const [numeroTarjeta, setNumeroTarjeta] = useState("");
  const [fechaVencimientoTarjeta, setFechaVencimientoTarjeta] = useState("");
  const [cvvTarjeta, setCvvTarjeta] = useState("");
  const [nombreTitularTarjeta, setNombreTitularTarjeta] = useState("");
  const [telefonoSinpe, setTelefonoSinpe] = useState("");
  const [procesandoPago, setProcesandoPago] = useState(false);
  const [errorPago, setErrorPago] = useState("");
  const paypalRenderizado = useRef(false);

  const tipoTarjetaDetectado = numeroTarjeta.startsWith("4")
    ? "Visa"
    : numeroTarjeta.startsWith("5")
    ? "Mastercard"
    : null;

  // Verificar login
  useEffect(() => {
    const token = localStorage.getItem("token_cliente");
    const datos = localStorage.getItem("cliente");
    if (!token || !datos) {
      navigate("/login");
      return;
    }
    const clienteParseado = JSON.parse(datos);
    setCliente(clienteParseado);
    setDireccion(clienteParseado.direccion || "");
    setNombreTitularTarjeta(clienteParseado.nombre || "");
  }, [navigate]);

  // Escuchar cambios desde otras páginas (DetalleProducto)
  useEffect(() => {
    const sincronizar = () => {
      try {
        setCarrito(JSON.parse(localStorage.getItem("carrito")) || []);
      } catch {
        setCarrito([]);
      }
    };
    window.addEventListener("carritoActualizado", sincronizar);
    window.addEventListener("storage", sincronizar);
    return () => {
      window.removeEventListener("carritoActualizado", sincronizar);
      window.removeEventListener("storage", sincronizar);
    };
  }, []);

  // Guardar en localStorage cuando el carrito cambia internamente
  useEffect(() => {
    localStorage.setItem("carrito", JSON.stringify(carrito));
  }, [carrito]);

  const eliminar = (id) => setCarrito((c) => c.filter((p) => p.id !== id));
  const aumentar = (id) => setCarrito((c) => c.map((p) => p.id === id ? { ...p, cantidad: p.cantidad + 1 } : p));
  const disminuir = (id) => setCarrito((c) => c.map((p) => p.id === id && p.cantidad > 1 ? { ...p, cantidad: p.cantidad - 1 } : p));
  const vaciar = () => { setCarrito([]); localStorage.removeItem("carrito"); registrar(ACCIONES.VACIAR_CARRITO); };

  const totalUnidades = carrito.reduce((t, p) => t + p.cantidad, 0);
  const esMayorista = totalUnidades >= 50;

  // Precio efectivo por producto: igual criterio que el backend
  // (si el pedido es mayorista y el producto tiene precio_mayorista, se usa ese)
  const precioEfectivo = (p) =>
    esMayorista && p.precio_mayorista && Number(p.precio_mayorista) > 0
      ? Number(p.precio_mayorista)
      : Number(p.precio);

  const total = carrito.reduce((t, p) => t + precioEfectivo(p) * p.cantidad, 0);

  const ubicacionTexto = [
    ubicacion.nombreDistrito,
    ubicacion.nombreCanton,
    ubicacion.nombreProvincia,
    ubicacion.nombrePais
  ].filter(Boolean).join(", ");

  const nombreMetodo = (id) => ({
    [METODO_TARJETA]: `Tarjeta${tipoTarjetaDetectado ? " " + tipoTarjetaDetectado : ""}`,
    [METODO_SINPE]: "Sinpe Móvil",
    [METODO_EFECTIVO]: "Efectivo contra entrega",
    [METODO_PAYPAL]: "PayPal",
  }[id] || "Desconocido");

  // ── Envía el pedido al backend y muestra el recibo (paso final, común a todos los métodos) ──
  const confirmarPedidoFinal = async (metodoTexto) => {
    setEnviando(true);
    const token = localStorage.getItem("token_cliente");
    try {
      const r = await fetch(`${API_BASE}/pedidos`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          metodo_pago_id: metodoPagoId,
          carrito,
          direccion,
          id_pais: ubicacion.idPais,
          id_provincia: ubicacion.idProvincia,
          id_canton: ubicacion.idCanton,
          id_distrito: ubicacion.idDistrito,
        }),
      });
      const datos = await r.json();
      if (!r.ok) {
        setErrorPago(datos.mensaje || "Error al registrar el pedido. Intenta de nuevo.");
        setEnviando(false);
        return;
      }
      const carritoParaRecibo = [...carrito];
      setRecibo({
        id: datos.pedido_id,
        cliente,
        direccion,
        ubicacionTexto,
        carrito: datos.detalle || carritoParaRecibo,
        total: datos.total,
        esMayorista: datos.esMayorista,
        metodo: metodoTexto,
        fecha: new Date().toLocaleDateString("es-CR"),
      });
      setCarrito([]);
      localStorage.removeItem("carrito");
    } catch (e) {
      console.error(e);
      setErrorPago("No se pudo conectar con el servidor. Verifica tu conexión e intenta de nuevo.");
    }
    setEnviando(false);
  };

  // ── Valida datos + ubicación antes de cualquier método de pago ──
  const validarAntesDePagar = () => {
    if (carrito.length === 0 || enviando || procesandoPago) return false;
    if (!ubicacion.idDistrito) {
      setErrorPago("Selecciona la ubicación de entrega (país, provincia, cantón y distrito).");
      return false;
    }
    return true;
  };

  // ── Botón "Confirmar pedido" para Tarjeta, SINPE y Efectivo ──
  const manejarConfirmar = async () => {
    if (!validarAntesDePagar()) return;
    setErrorPago("");

    if (metodoPagoId === METODO_TARJETA) {
      if (numeroTarjeta.length !== 16) {
        setErrorPago("El número de tarjeta debe tener 16 dígitos.");
        return;
      }
      if (!fechaVencimientoTarjeta.trim() || !cvvTarjeta.trim()) {
        setErrorPago("Completa la fecha de vencimiento y el CVV.");
        return;
      }
      setProcesandoPago(true);
      try {
        const r = await fetch(`${API_BASE}/banco/validar-tarjeta`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            numero_tarjeta: numeroTarjeta,
            fecha_vencimiento: fechaVencimientoTarjeta,
            cvv: cvvTarjeta,
            monto: total,
          }),
        });
        const d = await r.json();
        setProcesandoPago(false);
        if (!d.aprobado) {
          setErrorPago(d.mensaje || "El pago con tarjeta fue rechazado.");
          return;
        }
        await confirmarPedidoFinal(nombreMetodo(METODO_TARJETA));
      } catch {
        setProcesandoPago(false);
        setErrorPago("No se pudo conectar con el banco para validar la tarjeta.");
      }
      return;
    }

    if (metodoPagoId === METODO_SINPE) {
      if (telefonoSinpe.length !== 8) {
        setErrorPago("El número de SINPE debe tener 8 dígitos.");
        return;
      }
      setProcesandoPago(true);
      try {
        const r = await fetch(`${API_BASE}/banco/validar-sinpe`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ telefono: telefonoSinpe, monto: total }),
        });
        const d = await r.json();
        setProcesandoPago(false);
        if (!d.aprobado) {
          setErrorPago(d.mensaje || "El pago con SINPE fue rechazado.");
          return;
        }
        await confirmarPedidoFinal(nombreMetodo(METODO_SINPE));
      } catch {
        setProcesandoPago(false);
        setErrorPago("No se pudo conectar con el banco para validar el SINPE.");
      }
      return;
    }

    // Efectivo contra entrega — no necesita validación de banco
    await confirmarPedidoFinal(nombreMetodo(METODO_EFECTIVO));
  };

  // ── Botones de PayPal: se cargan solo cuando el cliente elige ese método ──
  useEffect(() => {
    if (metodoPagoId !== METODO_PAYPAL) {
      paypalRenderizado.current = false;
      return;
    }

    const renderizarBotonesPaypal = () => {
      const contenedor = document.getElementById("paypal-button-container");
      if (!contenedor || !window.paypal) return;
      contenedor.innerHTML = "";

      window.paypal.Buttons({
        createOrder: async () => {
          if (!validarAntesDePagar()) {
            throw new Error("Faltan datos antes de pagar");
          }
          setErrorPago("");
          const montoUSD = (total / tasaCambioActual).toFixed(2);
          const r = await fetch(`${API_BASE}/paypal/crear-orden`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ monto: montoUSD }),
          });
          const d = await r.json();
          if (!d.id) throw new Error("No se pudo crear la orden de PayPal");
          return d.id;
        },
        onApprove: async (data) => {
          setProcesandoPago(true);
          try {
            const r = await fetch(
              `${API_BASE}/paypal/capturar-orden/${data.orderID}`,
              { method: "POST" }
            );
            const d = await r.json();
            setProcesandoPago(false);
            if (d.status !== "COMPLETED") {
              setErrorPago("El pago con PayPal no se pudo completar.");
              return;
            }
            await confirmarPedidoFinal(nombreMetodo(METODO_PAYPAL));
          } catch {
            setProcesandoPago(false);
            setErrorPago("Error al confirmar el pago de PayPal.");
          }
        },
        onError: () => {
          setErrorPago("Ocurrió un error con PayPal. Intenta de nuevo.");
        },
      }).render("#paypal-button-container");

      paypalRenderizado.current = true;
    };

    if (window.paypal) {
      renderizarBotonesPaypal();
      return;
    }

    const scriptId = "paypal-sdk-script";
    let script = document.getElementById(scriptId);
    if (!script) {
      script = document.createElement("script");
      script.id = scriptId;
      script.src = `https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}&currency=USD`;
      script.onload = renderizarBotonesPaypal;
      document.body.appendChild(script);
    } else {
      script.addEventListener("load", renderizarBotonesPaypal);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [metodoPagoId, total, ubicacion, direccion, tasaCambioActual]);

  if (!cliente) return null;

  return (
    <>
      <Navbar />
      <div className="container py-4" style={{ maxWidth: "760px" }}>
        <div className="d-flex align-items-center gap-3 mb-4">
          <button className="btn-volver" onClick={() => navigate("/catalogo")}>
            <i className="bi bi-arrow-left"></i> Catálogo
          </button>
          <h1 className="fw-bold mb-0" style={{ fontSize: "1.5rem", color: "#1a3a2a" }}>
            Mi Pedido
          </h1>
        </div>

        {/* Datos del cliente */}
        <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: "16px" }}>
          <div className="card-header text-white fw-semibold"
            style={{ background: "#1a3a2a", borderRadius: "16px 16px 0 0" }}>
            <i className="bi bi-person-check-fill me-2"></i>Datos del cliente
          </div>
          <div className="card-body">
            <div className="row g-2">
              <div className="col-md-6">
                <small className="text-muted d-block mb-1">Nombre</small>
                <div className="form-control bg-light">{cliente.nombre}</div>
              </div>
              <div className="col-md-6">
                <small className="text-muted d-block mb-1">Teléfono</small>
                <div className="form-control bg-light">{cliente.telefono}</div>
              </div>
              <div className="col-12">
                <small className="text-muted d-block mb-1">Dirección exacta</small>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Ej: 200m norte del parque central"
                  value={direccion}
                  onChange={(e) => setDireccion(e.target.value)}
                />
              </div>

              <div className="col-12 mt-2">
                <small className="text-muted d-block mb-2">Ubicación de entrega</small>
                <UbicacionCascada onSeleccionCompleta={setUbicacion} />
              </div>

              <div className="col-12">
                <small className="text-muted d-block mb-1">Método de pago</small>
                <select
                  className="form-select mt-1"
                  value={metodoPagoId}
                  onChange={(e) => { setMetodoPagoId(Number(e.target.value)); setErrorPago(""); }}
                >
                  <option value={METODO_TARJETA}>Tarjeta (Visa / Mastercard)</option>
                  <option value={METODO_SINPE}>Sinpe Móvil</option>
                  <option value={METODO_EFECTIVO}>Efectivo contra entrega</option>
                  <option value={METODO_PAYPAL}>PayPal</option>
                </select>
              </div>

              {/* ── Campos de Tarjeta ── */}
              {metodoPagoId === METODO_TARJETA && (
                <div className="col-12 mt-2 p-3" style={{ background: "#f7f9f7", borderRadius: "12px" }}>

                  {/* Vista previa visual de la tarjeta */}
                  <div
                    className="mb-3 p-3 text-white"
                    style={{
                      background: tipoTarjetaDetectado === "Mastercard"
                        ? "linear-gradient(135deg, #ff5f00, #eb001b)"
                        : tipoTarjetaDetectado === "Visa"
                        ? "linear-gradient(135deg, #1a1f71, #2b3990)"
                        : "linear-gradient(135deg, #495057, #343a40)",
                      borderRadius: "14px",
                      minHeight: "150px",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                    }}
                  >
                    <div className="d-flex justify-content-between align-items-start">
                      <i className="bi bi-wifi" style={{ fontSize: "1.3rem", transform: "rotate(90deg)" }}></i>
                      {tipoTarjetaDetectado === "Mastercard" ? (
                        <div style={{ position: "relative", width: "46px", height: "28px" }}>
                          <div style={{
                            position: "absolute", left: 0, width: "28px", height: "28px",
                            borderRadius: "50%", background: "#eb001b", opacity: 0.9,
                          }}></div>
                          <div style={{
                            position: "absolute", left: "18px", width: "28px", height: "28px",
                            borderRadius: "50%", background: "#f79e1b", opacity: 0.9,
                          }}></div>
                        </div>
                      ) : (
                        <span className="fst-italic fw-bold" style={{ fontSize: "1.3rem" }}>
                          {tipoTarjetaDetectado === "Visa" ? "VISA" : "TARJETA"}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: "1.25rem", letterSpacing: "3px", fontFamily: "monospace" }}>
                      {(numeroTarjeta || "•••• •••• •••• ••••")
                        .padEnd(16, "•")
                        .match(/.{1,4}/g)
                        .join(" ")}
                    </div>
                    <div className="d-flex justify-content-between align-items-end">
                      <div>
                        <div style={{ fontSize: "0.65rem", opacity: 0.7 }}>TITULAR</div>
                        <div style={{ fontSize: "0.85rem", letterSpacing: "1px" }}>
                          {nombreTitularTarjeta.toUpperCase() || "NOMBRE APELLIDO"}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: "0.65rem", opacity: 0.7 }}>VENCE</div>
                        <div style={{ fontSize: "0.85rem" }}>{fechaVencimientoTarjeta || "MM/AA"}</div>
                      </div>
                    </div>
                  </div>

                  <div className="row g-2">
                    <div className="col-12">
                      <label className="form-label small fw-semibold">Nombre del titular</label>
                      <input
                        type="text" className="form-control"
                        placeholder="Como aparece en la tarjeta"
                        value={nombreTitularTarjeta}
                        onChange={(e) => setNombreTitularTarjeta(e.target.value)}
                      />
                    </div>
                    <div className="col-12">
                      <label className="form-label small fw-semibold">Número de tarjeta</label>
                      <input
                        type="text" className="form-control"
                        placeholder="16 dígitos"
                        value={numeroTarjeta}
                        onChange={(e) => setNumeroTarjeta(e.target.value.replace(/\D/g, "").slice(0, 16))}
                        maxLength={16}
                      />
                    </div>
                    <div className="col-6">
                      <label className="form-label small fw-semibold">Vencimiento (MM/AA)</label>
                      <input
                        type="text" className="form-control"
                        placeholder="12/28"
                        value={fechaVencimientoTarjeta}
                        onChange={(e) => setFechaVencimientoTarjeta(e.target.value.slice(0, 5))}
                        maxLength={5}
                      />
                    </div>
                    <div className="col-6">
                      <label className="form-label small fw-semibold">CVV</label>
                      <input
                        type="password" className="form-control"
                        placeholder="123"
                        value={cvvTarjeta}
                        onChange={(e) => setCvvTarjeta(e.target.value.replace(/\D/g, "").slice(0, 4))}
                        maxLength={4}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ── Campo de SINPE ── */}
              {metodoPagoId === METODO_SINPE && (
                <div className="col-12 mt-2 p-3" style={{ background: "#f7f9f7", borderRadius: "12px" }}>
                  <label className="form-label small fw-semibold">Número de SINPE Móvil</label>
                  <input
                    type="text" className="form-control"
                    placeholder="88887777"
                    value={telefonoSinpe}
                    onChange={(e) => setTelefonoSinpe(e.target.value.replace(/\D/g, "").slice(0, 8))}
                    maxLength={8}
                  />
                </div>
              )}

              {/* ── Botones de PayPal ── */}
              {metodoPagoId === METODO_PAYPAL && (
                <div className="col-12 mt-2 p-3" style={{ background: "#f7f9f7", borderRadius: "12px" }}>
                  <small className="text-muted d-block mb-2">
                    Se te redirigirá a PayPal para completar el pago de forma segura.
                  </small>
                  <div id="paypal-button-container"></div>
                </div>
              )}

              {errorPago && (
                <div className="col-12">
                  <div className="alert alert-danger py-2 mb-0 mt-2">
                    <i className="bi bi-x-circle me-2"></i>{errorPago}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Carrito vacío */}
        {carrito.length === 0 ? (
          <div className="text-center py-5">
            <i className="bi bi-cart-x" style={{ fontSize: "4rem", color: "#adb5bd" }}></i>
            <h4 className="mt-3">El carrito está vacío</h4>
            <p className="text-muted">Agrega productos desde el catálogo.</p>
            <button className="btn btn-success mt-2" onClick={() => navigate("/catalogo")}>
              <i className="bi bi-grid-3x3-gap-fill me-2"></i>Ver catálogo
            </button>
          </div>
        ) : (
          <>
            {esMayorista && (
              <div className="alert alert-success d-flex align-items-center gap-2 mb-3">
                <i className="bi bi-star-fill"></i>
                <span><strong>Precio mayorista aplicado</strong> — Tu pedido supera las 50 unidades</span>
              </div>
            )}

            <div className="admin-lista mb-4">
              {carrito.map((p) => (
                <div className="admin-fila" key={p.id}>
                  <div className="admin-fila-header">
                    <span className="admin-fila-nombre">{p.nombre}</span>
                    <span className="fw-bold text-success">
                      ₡{(precioEfectivo(p) * p.cantidad).toLocaleString()}
                    </span>
                  </div>
                  <div className="admin-fila-datos">
                    <div className="admin-fila-dato">
                      <i className="bi bi-tag"></i>
                      <span>₡{precioEfectivo(p).toLocaleString()} c/u</span>
                    </div>
                  </div>
                  <div className="admin-fila-acciones">
                    <div className="d-flex align-items-center gap-2">
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => disminuir(p.id)}
                        aria-label={`Disminuir cantidad de ${p.nombre}`}
                      >−</button>
                      <span className="fw-bold px-2">{p.cantidad}</span>
                      <button
                        className="btn btn-sm btn-outline-success"
                        onClick={() => aumentar(p.id)}
                        aria-label={`Aumentar cantidad de ${p.nombre}`}
                      >+</button>
                    </div>
                    <button
                      className="btn btn-sm btn-danger ms-2"
                      onClick={() => eliminar(p.id)}
                      aria-label={`Eliminar ${p.nombre} del carrito`}
                    >
                      <i className="bi bi-trash" aria-hidden="true"></i>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="d-flex justify-content-between align-items-center mb-3 px-1">
              <span className="text-muted">{totalUnidades} unidad{totalUnidades !== 1 ? "es" : ""}</span>
              <h4 className="fw-bold text-success mb-0">Total: ₡{total.toLocaleString()}</h4>
            </div>

            <div className="d-flex gap-2 justify-content-end">
              <button className="btn btn-outline-danger" onClick={vaciar} aria-label="Vaciar todo el carrito">
                <i className="bi bi-trash me-1" aria-hidden="true"></i>Vaciar
              </button>
              {metodoPagoId !== METODO_PAYPAL && (
                <button
                  className="btn btn-success px-4"
                  onClick={manejarConfirmar}
                  disabled={enviando || procesandoPago}
                >
                  {(enviando || procesandoPago)
                    ? <span className="spinner-border spinner-border-sm me-2"></span>
                    : <i className="bi bi-check-circle-fill me-2"></i>}
                  Confirmar pedido
                </button>
              )}
            </div>
          </>
        )}
      </div>

      {/* MODAL RECIBO */}
      {recibo && (
        <>
          <div className="position-fixed top-0 start-0 w-100 h-100"
            style={{ background: "rgba(0,0,0,0.6)", zIndex: 1040 }} />
          <div className="position-fixed top-50 start-50 translate-middle recibo-modal"
            style={{ zIndex: 1050, width: "95%", maxWidth: "560px", maxHeight: "90vh", display: "flex", flexDirection: "column" }}>
            <div className="card shadow-lg border-0" style={{ borderRadius: "20px", overflow: "hidden", maxHeight: "90vh", display: "flex", flexDirection: "column" }}>
              <div className="card-header text-white text-center py-3" style={{ background: "#1a3a2a", flexShrink: 0 }}>
                <i className="bi bi-check-circle-fill me-2" style={{ color: "#74c69d" }}></i>
                <span className="fw-bold">
                  ¡Gracias, {recibo.cliente?.nombre?.split(" ")[0]}! Tu pedido está confirmado 🎉
                </span>
              </div>
              <div className="card-body p-4" style={{ overflowY: "auto", flex: 1 }}>
                <div className="text-center mb-3">
                  <strong style={{ color: "#1a3a2a" }}>Distribuidora S.M</strong>
                  <div className="text-muted small">Pedido #{recibo.id} — {recibo.fecha}</div>
                </div>
                <hr />
                <div className="mb-3">
                  <div><strong>Cliente:</strong> {recibo.cliente.nombre}</div>
                  <div><strong>Teléfono:</strong> {recibo.cliente.telefono}</div>
                  {recibo.direccion && <div><strong>Dirección:</strong> {recibo.direccion}</div>}
                  {recibo.ubicacionTexto && <div><strong>Ubicación:</strong> {recibo.ubicacionTexto}</div>}
                  <div><strong>Pago:</strong> {recibo.metodo}</div>
                  {recibo.esMayorista === 1 && (
                    <span className="badge bg-success mt-1">Precio mayorista aplicado</span>
                  )}
                </div>
                <hr />
                <table className="table table-sm mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Producto</th>
                      <th className="text-center">Cant.</th>
                      <th className="text-end">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recibo.carrito.map((p, i) => (
                      <tr key={i}>
                        <td>{p.nombre}</td>
                        <td className="text-center">{p.cantidad}</td>
                        <td className="text-end">₡{Number(p.subtotal ?? (Number(p.precio_unitario ?? p.precio) * p.cantidad)).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={2} className="text-end text-muted">Subtotal (sin IVA)</td>
                      <td className="text-end text-muted">
                        ₡{Math.round(Number(recibo.total) / 1.13).toLocaleString()}
                      </td>
                    </tr>
                    <tr>
                      <td colSpan={2} className="text-end text-muted">IVA (13%)</td>
                      <td className="text-end text-muted">
                        ₡{(Number(recibo.total) - Math.round(Number(recibo.total) / 1.13)).toLocaleString()}
                      </td>
                    </tr>
                    <tr>
                      <td colSpan={2} className="text-end fw-bold">Total</td>
                      <td className="text-end fw-bold text-success">
                        ₡{Number(recibo.total).toLocaleString()}
                      </td>
                    </tr>
                  </tfoot>
                </table>

                {/* ── Tipo de cambio BCCR (nueva funcionalidad) ── */}
                <div
                  className="mt-3 p-3 d-flex align-items-center justify-content-between"
                  style={{
                    background: "linear-gradient(135deg, #e7f3ec, #d8ece1)",
                    border: "1px solid #74c69d",
                    borderRadius: "12px",
                  }}
                >
                  <div>
                    <div className="d-flex align-items-center gap-2 mb-1">
                      <i className="bi bi-bank2" style={{ color: "#1a3a2a" }}></i>
                      <span className="fw-bold small" style={{ color: "#1a3a2a" }}>
                        Equivalente en USD
                      </span>
                    </div>
                    <div className="text-muted" style={{ fontSize: "0.72rem" }}>
                      Tipo de cambio de compra oficial — Banco Central de Costa Rica (BCCR)
                      {tipoCambioBCCR?.fecha && ` · ${tipoCambioBCCR.fecha}`}
                    </div>
                  </div>
                  <div className="text-end">
                    <div className="fw-bold" style={{ color: "#1a3a2a", fontSize: "1.15rem" }}>
                      ${(Number(recibo.total) / tasaCambioActual).toFixed(2)}
                    </div>
                    <div className="text-muted" style={{ fontSize: "0.7rem" }}>
                      ₡{tasaCambioActual.toLocaleString()} = $1
                    </div>
                  </div>
                </div>

                <p className="text-muted text-center small mt-3 mb-0">
                  Gracias por tu compra. Nos pondremos en contacto para coordinar la entrega.
                </p>
              </div>
              <div className="card-footer d-flex gap-2 justify-content-center py-3" style={{ flexShrink: 0 }}>
                <button className="btn btn-outline-secondary" onClick={() => window.print()} aria-label="Imprimir recibo del pedido">
                  <i className="bi bi-printer me-2" aria-hidden="true"></i>Imprimir
                </button>
                <button className="btn btn-success" onClick={() => navigate("/")} aria-label="Volver a la página de inicio">
                  <i className="bi bi-house-fill me-2" aria-hidden="true"></i>Ir al inicio
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}

export default Pedido;