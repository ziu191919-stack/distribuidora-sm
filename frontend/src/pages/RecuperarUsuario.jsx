import { useState } from "react";
import { Link } from "react-router-dom";
import "../App.css";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";
const API = `${API_BASE}/auth/clientes`;

function RecuperarUsuario() {
  // Paso: 1=correo, 2=pregunta, 3=pista
  const [paso, setPaso]             = useState(1);
  const [email, setEmail]           = useState("");
  const [clienteId, setClienteId]   = useState(null);
  const [preguntaId, setPreguntaId] = useState(null);
  const [pregunta, setPregunta]     = useState("");
  const [respuesta, setRespuesta]   = useState("");
  const [pista, setPista]           = useState("");
  const [error, setError]           = useState("");
  const [cargando, setCargando]     = useState(false);

  const buscarCuenta = async () => {
    setError("");
    if (!email.trim()) { setError("Ingresa tu correo"); return; }
    setCargando(true);
    try {
      const r = await fetch(`${API}/recuperar-usuario/buscar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const d = await r.json();
      if (!r.ok) { setError(d.mensaje); setCargando(false); return; }
      setClienteId(d.cliente_id);
      setPreguntaId(d.pregunta_id);
      setPregunta(d.pregunta);
      setPaso(2);
    } catch { setError("No se pudo conectar con el servidor"); }
    setCargando(false);
  };

  const verificarRespuesta = async () => {
    setError("");
    if (!respuesta.trim()) { setError("Escribe tu respuesta"); return; }
    setCargando(true);
    try {
      const r = await fetch(`${API}/recuperar-usuario/revelar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cliente_id: clienteId, pregunta_id: preguntaId, respuesta }),
      });
      const d = await r.json();
      if (!r.ok) { setError(d.mensaje); setCargando(false); return; }
      setPista(d.pista);
      setPaso(3);
    } catch { setError("No se pudo conectar con el servidor"); }
    setCargando(false);
  };

  return (
    <div className="auth-page">
      <div className="auth-card">

        {/* PASO 1 — Correo */}
        {paso === 1 && (
          <>
            <div className="auth-logo"><i className="bi bi-person-fill-exclamation"></i></div>
            <h2 className="auth-titulo">Recuperar usuario</h2>
            <p className="auth-sub">Ingresa tu correo registrado</p>

            <div className="mb-3">
              <label className="form-label fw-semibold">Correo electrónico</label>
              <input type="email" className="form-control" placeholder="tucorreo@ejemplo.com"
                value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>

            {error && <div className="alert alert-danger py-2 mb-3">{error}</div>}

            <button className="btn btn-success w-100 py-2 fw-semibold mb-3"
              onClick={buscarCuenta} disabled={cargando}>
              {cargando ? <span className="spinner-border spinner-border-sm me-2"></span>
                : <i className="bi bi-search me-2"></i>}
              Buscar cuenta
            </button>

            <Link to="/login" className="btn btn-outline-secondary w-100">
              <i className="bi bi-arrow-left me-2"></i>Volver al login
            </Link>
          </>
        )}

        {/* PASO 2 — Pregunta de seguridad */}
        {paso === 2 && (
          <>
            <div className="auth-logo"><i className="bi bi-shield-lock-fill"></i></div>
            <h2 className="auth-titulo">Pregunta de seguridad</h2>

            <div className="pregunta-box mb-3">
              <i className="bi bi-question-circle me-2"></i>{pregunta}
            </div>

            <div className="mb-3">
              <label className="form-label fw-semibold">Tu respuesta</label>
              <input type="text" className="form-control" placeholder="Escribe tu respuesta"
                value={respuesta} onChange={(e) => setRespuesta(e.target.value)} />
            </div>

            {error && <div className="alert alert-danger py-2 mb-3">{error}</div>}

            <button className="btn btn-success w-100 py-2 fw-semibold mb-3"
              onClick={verificarRespuesta} disabled={cargando}>
              {cargando ? <span className="spinner-border spinner-border-sm me-2"></span>
                : <i className="bi bi-check-lg me-2"></i>}
              Verificar respuesta
            </button>

            <button className="btn btn-outline-secondary w-100"
              onClick={() => { setPaso(1); setError(""); setRespuesta(""); }}>
              <i className="bi bi-arrow-left me-2"></i>Volver
            </button>
          </>
        )}

        {/* PASO 3 — Solo pista */}
        {paso === 3 && (
          <>
            <div className="auth-logo"><i className="bi bi-person-circle"></i></div>
            <h2 className="auth-titulo">Tu usuario</h2>
            <p className="auth-sub">Esta es la pista de tu usuario registrado</p>

            <div className="pista-usuario-box mb-4">
              <div className="pista-label">Pista de tu usuario</div>
              <div className="pista-valor">{pista}</div>
            </div>

            <Link to="/login" className="btn btn-success w-100 py-2 fw-semibold">
              <i className="bi bi-box-arrow-in-right me-2"></i>Ir al login
            </Link>
          </>
        )}

      </div>
    </div>
  );
}

export default RecuperarUsuario;