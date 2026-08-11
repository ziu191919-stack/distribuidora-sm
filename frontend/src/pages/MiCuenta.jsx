import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import "../App.css";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";
const API = `${API_BASE}/auth/clientes`;

function MiCuenta() {
  const [cliente, setCliente]         = useState(null);
  const [totpConfigurado, setTotpConfigurado] = useState(false);
  const navigate = useNavigate();

  // Sección Google Auth
  const [mostrarGoogleAuth, setMostrarGoogleAuth] = useState(false);
  const [pasoTotp, setPasoTotp]       = useState(1);
  const [qrBase64, setQrBase64]       = useState("");
  const [secretTotp, setSecretTotp]   = useState("");
  const [codigoTotp, setCodigoTotp]   = useState("");
  const [totpError, setTotpError]     = useState("");
  const [totpCargando, setTotpCargando] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token_cliente");
    const datos = localStorage.getItem("cliente");
    if (!token || !datos) { navigate("/login"); return; }

    const clienteLocal = JSON.parse(datos);
    setCliente(clienteLocal);

    // Consultar al backend si ya tiene totp_secret configurado
    fetch(`${API}/totp/estado?cliente_id=${clienteLocal.id}`)
      .then(r => r.json())
      .then(d => setTotpConfigurado(d.configurado || false))
      .catch(() => {});
  }, [navigate]);

  const cerrarSesion = () => {
    localStorage.removeItem("token_cliente");
    localStorage.removeItem("cliente");
    navigate("/login");
  };

  const generarQR = async () => {
    setTotpError("");
    setTotpCargando(true);
    try {
      const r = await fetch(`${API}/totp/generar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cliente_id: cliente.id }),
      });
      const d = await r.json();
      if (!r.ok) { setTotpError(d.mensaje); setTotpCargando(false); return; }
      setQrBase64(d.qr);
      setSecretTotp(d.secret);
      setPasoTotp(2);
    } catch { setTotpError("No se pudo conectar con el servidor"); }
    setTotpCargando(false);
  };

  const confirmarTOTP = async () => {
    setTotpError("");
    if (!codigoTotp.trim() || codigoTotp.length !== 6) {
      setTotpError("Ingresa el código de 6 dígitos de la app");
      return;
    }
    setTotpCargando(true);
    try {
      const r = await fetch(`${API}/totp/confirmar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cliente_id: cliente.id, secret: secretTotp, codigo: codigoTotp }),
      });
      const d = await r.json();
      if (!r.ok) { setTotpError(d.mensaje); setTotpCargando(false); return; }
      setTotpConfigurado(true);
      setPasoTotp(3);
    } catch { setTotpError("No se pudo confirmar"); }
    setTotpCargando(false);
  };

  if (!cliente) return null;

  return (
    <>
      <Navbar />
      <div className="container py-5" style={{ maxWidth: "600px" }}>
        <div className="auth-card" style={{ maxWidth: "100%" }}>
          <div className="auth-logo">
            <i className="bi bi-person-circle"></i>
          </div>
          <h2 className="auth-titulo">Mi Cuenta</h2>
          <p className="auth-sub">Bienvenido, {cliente.nombre}</p>

          <div className="mb-3">
            <label className="form-label text-muted small mb-1">Nombre</label>
            <div className="form-control bg-light">{cliente.nombre}</div>
          </div>

          {cliente.cedula && (
            <div className="mb-3">
              <label className="form-label text-muted small mb-1">Cédula</label>
              <div className="form-control bg-light">{cliente.cedula}</div>
            </div>
          )}

          {cliente.usuario && (
            <div className="mb-3">
              <label className="form-label text-muted small mb-1">Usuario</label>
              <div className="form-control bg-light">{cliente.usuario}</div>
            </div>
          )}

          {cliente.telefono && (
            <div className="mb-3">
              <label className="form-label text-muted small mb-1">Teléfono</label>
              <div className="form-control bg-light">{cliente.telefono}</div>
            </div>
          )}

          {cliente.direccion && (
            <div className="mb-4">
              <label className="form-label text-muted small mb-1">Dirección</label>
              <div className="form-control bg-light">{cliente.direccion}</div>
            </div>
          )}

          <hr className="my-4" />

          {/* ── Sección Google Authenticator ─────────────────────────────── */}
          <div className="totp-seccion">
            <div
              className="totp-seccion-header"
              onClick={() => !totpConfigurado && setMostrarGoogleAuth(!mostrarGoogleAuth)}
              style={{ cursor: totpConfigurado ? "default" : "pointer" }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div className="totp-icono" style={{ background: totpConfigurado ? "#d8f3dc" : "#f0f0f0" }}>
                  <i className="bi bi-google" style={{ color: totpConfigurado ? "#2d6a4f" : "#adb5bd" }}></i>
                </div>
                <div>
                  <div className="totp-titulo">Google Authenticator</div>
                  {totpConfigurado ? (
                    <div className="totp-sub" style={{ color: "#40916c", fontWeight: 600 }}>
                      <i className="bi bi-check-circle-fill me-1"></i>Configurado y activo
                    </div>
                  ) : (
                    <div className="totp-sub">Configura el segundo factor de autenticación</div>
                  )}
                </div>
              </div>
              {!totpConfigurado && (
                <i className={`bi bi-chevron-${mostrarGoogleAuth ? "up" : "down"}`} style={{ color: "#6c757d" }}></i>
              )}
            </div>

            {/* Solo mostrar si no está configurado */}
            {!totpConfigurado && mostrarGoogleAuth && (
              <div className="totp-cuerpo">

                {pasoTotp === 1 && (
                  <>
                    <p className="totp-instruccion">
                      Para configurar Google Authenticator necesitás:
                    </p>
                    <ol className="totp-pasos-lista">
                      <li>Descargar la app <strong>Google Authenticator</strong> en tu celular</li>
                      <li>Tocar el botón <strong>+</strong> dentro de la app</li>
                      <li>Seleccionar <strong>Escanear código QR</strong></li>
                      <li>Escanear el QR que aparecerá en pantalla</li>
                      <li>Ingresar el código de 6 dígitos para confirmar</li>
                    </ol>
                    {totpError && <div className="alert alert-danger py-2 mb-3">{totpError}</div>}
                    <button className="btn btn-success w-100 fw-semibold" onClick={generarQR} disabled={totpCargando}>
                      {totpCargando
                        ? <span className="spinner-border spinner-border-sm me-2"></span>
                        : <i className="bi bi-qr-code me-2"></i>}
                      Generar QR
                    </button>
                  </>
                )}

                {pasoTotp === 2 && (
                  <>
                    <p className="totp-instruccion text-center">
                      Escanea este código QR con la app Google Authenticator
                    </p>
                    <div className="totp-qr-wrapper">
                      <img src={qrBase64} alt="QR Google Authenticator" className="totp-qr-img" />
                    </div>
                    <p className="text-center text-muted" style={{ fontSize: "0.8rem", marginBottom: "16px" }}>
                      ¿No podés escanear? Ingresa esta clave manualmente:
                      <br />
                      <code style={{ fontSize: "0.85rem", letterSpacing: "0.1em", color: "#2d6a4f" }}>{secretTotp}</code>
                    </p>
                    <div className="mb-3">
                      <label className="form-label fw-semibold">
                        Ingresa el código de la app para confirmar
                      </label>
                      <input
                        type="text"
                        className="form-control text-center fw-bold"
                        placeholder="000000"
                        value={codigoTotp}
                        onChange={(e) => setCodigoTotp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        maxLength={6}
                        style={{ letterSpacing: "0.4em", fontSize: "1.5rem" }}
                      />
                    </div>
                    {totpError && <div className="alert alert-danger py-2 mb-3">{totpError}</div>}
                    <div className="d-flex gap-2">
                      <button className="btn btn-outline-secondary flex-grow-1"
                        onClick={() => { setPasoTotp(1); setTotpError(""); }}>
                        <i className="bi bi-arrow-left me-1"></i>Volver
                      </button>
                      <button className="btn btn-success flex-grow-1 fw-semibold"
                        onClick={confirmarTOTP} disabled={totpCargando}>
                        {totpCargando
                          ? <span className="spinner-border spinner-border-sm me-2"></span>
                          : <i className="bi bi-check-lg me-2"></i>}
                        Confirmar
                      </button>
                    </div>
                  </>
                )}

                {pasoTotp === 3 && (
                  <div className="text-center py-2">
                    <div style={{ fontSize: "2.5rem", color: "#40916c", marginBottom: "8px" }}>
                      <i className="bi bi-check-circle-fill"></i>
                    </div>
                    <p className="fw-semibold" style={{ color: "#1a3a2a" }}>
                      Google Authenticator configurado
                    </p>
                    <p className="text-muted" style={{ fontSize: "0.85rem" }}>
                      En tu próximo login podrás elegir Google Authenticator como método de verificación.
                    </p>
                  </div>
                )}

              </div>
            )}
          </div>

          <hr className="my-4" />

          <div className="d-flex flex-column gap-2">
            <Link to="/pedido" className="btn btn-success w-100">
              <i className="bi bi-cart-fill me-2"></i>Mi Carrito
            </Link>
            <Link to="/catalogo" className="btn btn-outline-success w-100">
              <i className="bi bi-grid-3x3-gap-fill me-2"></i>Ver Catálogo
            </Link>
            <button className="btn btn-outline-danger w-100" onClick={cerrarSesion}>
              <i className="bi bi-box-arrow-right me-2"></i>Cerrar sesión
            </button>
          </div>

          <div className="text-center mt-3">
            <Link to="/" className="text-muted small">
              <i className="bi bi-house-fill me-1"></i>Volver al inicio
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}

export default MiCuenta;