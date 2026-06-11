import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import "../App.css";

function Pedido() {
  const navigate = useNavigate();
  const [cliente, setCliente] = useState(null);
  const [carrito, setCarrito] = useState(() => {
    // Leer localStorage en el momento exacto que se crea el componente
    try {
      return JSON.parse(localStorage.getItem("carrito")) || [];
    } catch {
      return [];
    }
  });
  const [metodoPagoId, setMetodoPagoId] = useState(2);
  const [recibo, setRecibo] = useState(null);
  const [enviando, setEnviando] = useState(false);

  // Verificar login
  useEffect(() => {
    const token = localStorage.getItem("token_cliente");
    const datos = localStorage.getItem("cliente");
    if (!token || !datos) {
      navigate("/login");
      return;
    }
    setCliente(JSON.parse(datos));
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
  const vaciar = () => { setCarrito([]); localStorage.removeItem("carrito"); };

  const total = carrito.reduce((t, p) => t + Number(p.precio) * p.cantidad, 0);
  const totalUnidades = carrito.reduce((t, p) => t + p.cantidad, 0);
  const esMayorista = totalUnidades >= 50;

  const realizarPedido = async () => {
    if (carrito.length === 0 || enviando) return;
    setEnviando(true);
    const token = localStorage.getItem("token_cliente");
    try {
      const r = await fetch("http://localhost:3000/pedidos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ metodo_pago_id: metodoPagoId, carrito }),
      });
      const datos = await r.json();
      if (!r.ok) {
        alert(datos.mensaje || "Error al registrar pedido");
        setEnviando(false);
        return;
      }
      const carritoParaRecibo = [...carrito];
      setRecibo({
        id: datos.pedido_id,
        cliente,
        carrito: datos.detalle || carritoParaRecibo,
        total: datos.total,
        esMayorista: datos.esMayorista,
        metodo: metodoPagoId === 2 ? "Sinpe Móvil" : "Efectivo contra entrega",
        fecha: new Date().toLocaleDateString("es-CR"),
      });
      setCarrito([]);
      localStorage.removeItem("carrito");
    } catch (e) {
      console.error(e);
      alert("Error al registrar pedido. Verifique su conexión.");
    }
    setEnviando(false);
  };

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
              {cliente.direccion && (
                <div className="col-12">
                  <small className="text-muted d-block mb-1">Dirección</small>
                  <div className="form-control bg-light">{cliente.direccion}</div>
                </div>
              )}
              <div className="col-12">
                <small className="text-muted d-block mb-1">Método de pago</small>
                <select className="form-select mt-1" value={metodoPagoId}
                  onChange={(e) => setMetodoPagoId(Number(e.target.value))}>
                  <option value={2}>Sinpe Móvil</option>
                  <option value={3}>Efectivo contra entrega</option>
                </select>
              </div>
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
                      ₡{(Number(p.precio) * p.cantidad).toLocaleString()}
                    </span>
                  </div>
                  <div className="admin-fila-datos">
                    <div className="admin-fila-dato">
                      <i className="bi bi-tag"></i>
                      <span>₡{Number(p.precio).toLocaleString()} c/u</span>
                    </div>
                  </div>
                  <div className="admin-fila-acciones">
                    <div className="d-flex align-items-center gap-2">
                      <button className="btn btn-sm btn-outline-danger" onClick={() => disminuir(p.id)}>−</button>
                      <span className="fw-bold px-2">{p.cantidad}</span>
                      <button className="btn btn-sm btn-outline-success" onClick={() => aumentar(p.id)}>+</button>
                    </div>
                    <button className="btn btn-sm btn-danger ms-2" onClick={() => eliminar(p.id)}>
                      <i className="bi bi-trash"></i>
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
              <button className="btn btn-outline-danger" onClick={vaciar}>
                <i className="bi bi-trash me-1"></i>Vaciar
              </button>
              <button className="btn btn-success px-4" onClick={realizarPedido} disabled={enviando}>
                {enviando
                  ? <span className="spinner-border spinner-border-sm me-2"></span>
                  : <i className="bi bi-check-circle-fill me-2"></i>}
                Confirmar pedido
              </button>
            </div>
          </>
        )}
      </div>

      {/* MODAL RECIBO */}
      {recibo && (
        <>
          <div className="position-fixed top-0 start-0 w-100 h-100"
            style={{ background: "rgba(0,0,0,0.6)", zIndex: 1040 }} />
          <div className="position-fixed top-50 start-50 translate-middle"
            style={{ zIndex: 1050, width: "95%", maxWidth: "560px" }}>
            <div className="card shadow-lg border-0" style={{ borderRadius: "20px", overflow: "hidden" }}>
              <div className="card-header text-white text-center py-3" style={{ background: "#1a3a2a" }}>
                <i className="bi bi-check-circle-fill me-2" style={{ color: "#74c69d" }}></i>
                <span className="fw-bold">Pedido confirmado</span>
              </div>
              <div className="card-body p-4">
                <div className="text-center mb-3">
                  <strong style={{ color: "#1a3a2a" }}>Distribuidora S.M</strong>
                  <div className="text-muted small">Pedido #{recibo.id} — {recibo.fecha}</div>
                </div>
                <hr />
                <div className="mb-3">
                  <div><strong>Cliente:</strong> {recibo.cliente.nombre}</div>
                  <div><strong>Teléfono:</strong> {recibo.cliente.telefono}</div>
                  {recibo.cliente.direccion && <div><strong>Dirección:</strong> {recibo.cliente.direccion}</div>}
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
                        <td className="text-end">₡{(Number(p.precio) * p.cantidad).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={2} className="text-end fw-bold">Total</td>
                      <td className="text-end fw-bold text-success">
                        ₡{Number(recibo.total).toLocaleString()}
                      </td>
                    </tr>
                  </tfoot>
                </table>
                <p className="text-muted text-center small mt-3 mb-0">
                  Gracias por tu compra. Nos pondremos en contacto para coordinar la entrega.
                </p>
              </div>
              <div className="card-footer d-flex gap-2 justify-content-center py-3">
                <button className="btn btn-outline-secondary" onClick={() => window.print()}>
                  <i className="bi bi-printer me-2"></i>Imprimir
                </button>
                <button className="btn btn-success" onClick={() => navigate("/")}>
                  <i className="bi bi-house-fill me-2"></i>Ir al inicio
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