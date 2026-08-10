import { useState } from "react";
import { Link } from "react-router-dom";
import "../App.css";

const API = "http://localhost:3000/auth/clientes";

const REGEX_PASSWORD = /^(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;

function CheckItem({ ok, texto }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:"8px", fontSize:"0.82rem",
      color: ok ? "#2d6a4f" : "#6c757d", marginBottom:"2px" }}>
      <i className={`bi bi-${ok ? "check-circle-fill" : "x-circle"}`}
        style={{ color: ok ? "#40916c" : "#adb5bd", fontSize:"0.9rem" }}></i>
      {texto}
    </div>
  );
}

function OlvidePassword() {
  // Paso: 1=correo, 2=pregunta, 3=nueva contraseña, 4=éxito
  const [paso, setPaso]           = useState(1);
  const [email, setEmail]         = useState("");
  const [clienteId, setClienteId] = useState(null);
  const [preguntaId, setPreguntaId] = useState(null);
  const [pregunta, setPregunta]   = useState("");
  const [respuesta, setRespuesta] = useState("");
  const [password, setPassword]   = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [verPwd, setVerPwd]       = useState(false);
  const [verConf, setVerConf]     = useState(false);
  const [error, setError]         = useState("");
  const [cargando, setCargando]   = useState(false);

  const pwd = password;
  const checks = {
    longitud:  pwd.length >= 8,
    mayuscula: /[A-Z]/.test(pwd),
    minuscula: /[a-z]/.test(pwd),
    numero:    /[0-9]/.test(pwd),
    simbolo:   /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd),
  };

  const buscarCuenta = async () => {
    setError("");
    if (!email.trim()) { setError("Ingresa tu correo"); return; }
    setCargando(true);
    try {
      const r = await fetch(`${API}/recuperar-password/buscar`, {
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
      const r = await fetch(`${API}/recuperar-password/verificar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cliente_id: clienteId, pregunta_id: preguntaId, respuesta }),
      });
      const d = await r.json();
      if (!r.ok) { setError(d.mensaje); setCargando(false); return; }
      setPaso(3);
    } catch { setError("No se pudo conectar con el servidor"); }
    setCargando(false);
  };

  const cambiarPassword = async () => {
    setError("");
    if (!REGEX_PASSWORD.test(password)) { setError("La contraseña no cumple los requisitos"); return; }
    if (password !== confirmar) { setError("Las contraseñas no coinciden"); return; }
    setCargando(true);
    try {
      const r = await fetch(`${API}/recuperar-password/cambiar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cliente_id: clienteId, password }),
      });
      const d = await r.json();
      if (!r.ok) { setError(d.mensaje); setCargando(false); return; }
      setPaso(4);
    } catch { setError("No se pudo conectar con el servidor"); }
    setCargando(false);
  };

  return (
    <div className="auth-page">
      <div className="auth-card">

        {paso === 1 && (
          <>
            <div className="auth-logo"><i className="bi bi-key-fill"></i></div>
            <h2 className="auth-titulo">Recuperar contraseña</h2>
            <p className="auth-sub">Ingresa tu correo para buscar tu cuenta</p>
            <div className="mb-3">
              <label className="form-label fw-semibold">Correo electrónico</label>
              <input type="email" className="form-control" placeholder="tucorreo@ejemplo.com"
                value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            {error && <div className="alert alert-danger py-2 mb-3">{error}</div>}
            <button className="btn btn-success w-100 py-2 fw-semibold mb-3" onClick={buscarCuenta} disabled={cargando}>
              {cargando ? <span className="spinner-border spinner-border-sm me-2"></span>
                : <i className="bi bi-search me-2"></i>}
              Buscar cuenta
            </button>
            <Link to="/login" className="btn btn-outline-secondary w-100">
              <i className="bi bi-arrow-left me-2"></i>Volver al login
            </Link>
          </>
        )}

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
            <button className="btn btn-success w-100 py-2 fw-semibold mb-3" onClick={verificarRespuesta} disabled={cargando}>
              {cargando ? <span className="spinner-border spinner-border-sm me-2"></span>
                : <i className="bi bi-check-lg me-2"></i>}
              Verificar respuesta
            </button>
            <button className="btn btn-outline-secondary w-100" onClick={() => { setPaso(1); setError(""); setRespuesta(""); }}>
              <i className="bi bi-arrow-left me-2"></i>Volver
            </button>
          </>
        )}

        {paso === 3 && (
          <>
            <div className="auth-logo"><i className="bi bi-lock-fill"></i></div>
            <h2 className="auth-titulo">Nueva contraseña</h2>
            <p className="auth-sub">Crea una contraseña segura</p>
            <div className="mb-1">
              <label className="form-label fw-semibold">Nueva contraseña</label>
              <div className="input-group">
                <input type={verPwd ? "text" : "password"} className="form-control"
                  value={password} onChange={(e) => setPassword(e.target.value)} />
                <button type="button" className="btn btn-outline-secondary" onClick={() => setVerPwd(!verPwd)}>
                  <i className={`bi bi-eye${verPwd ? "-slash" : ""}`}></i>
                </button>
              </div>
            </div>
            <div className="pwd-checks mb-2">
              <CheckItem ok={checks.longitud}  texto="Mínimo 8 caracteres" />
              <CheckItem ok={checks.mayuscula} texto="Al menos una mayúscula" />
              <CheckItem ok={checks.minuscula} texto="Al menos una minúscula" />
              <CheckItem ok={checks.numero}    texto="Al menos un número" />
              <CheckItem ok={checks.simbolo}   texto="Al menos un símbolo (!@#$...)" />
            </div>
            <div className="mb-3">
              <label className="form-label fw-semibold">Confirmar contraseña</label>
              <div className="input-group">
                <input type={verConf ? "text" : "password"} className="form-control"
                  value={confirmar} onChange={(e) => setConfirmar(e.target.value)} />
                <button type="button" className="btn btn-outline-secondary" onClick={() => setVerConf(!verConf)}>
                  <i className={`bi bi-eye${verConf ? "-slash" : ""}`}></i>
                </button>
              </div>
              {confirmar && (
                <small className={password === confirmar ? "text-success" : "text-danger"}>
                  <i className={`bi bi-${password === confirmar ? "check-circle-fill" : "x-circle"} me-1`}></i>
                  {password === confirmar ? "Las contraseñas coinciden" : "No coinciden"}
                </small>
              )}
            </div>
            {error && <div className="alert alert-danger py-2 mb-3">{error}</div>}
            <button className="btn btn-success w-100 py-2 fw-semibold" onClick={cambiarPassword} disabled={cargando}>
              {cargando ? <span className="spinner-border spinner-border-sm me-2"></span>
                : <i className="bi bi-check-circle-fill me-2"></i>}
              Guardar nueva contraseña
            </button>
          </>
        )}

        {paso === 4 && (
          <div className="text-center">
            <div style={{ fontSize:"4rem", color:"#40916c", marginBottom:"1rem" }}>
              <i className="bi bi-check-circle-fill"></i>
            </div>
            <h2 className="auth-titulo">Contraseña actualizada</h2>
            <p className="auth-sub">Ya puedes iniciar sesión con tu nueva contraseña</p>
            <Link to="/login" className="btn btn-success w-100 py-2 fw-semibold">
              <i className="bi bi-box-arrow-in-right me-2"></i>Ir al login
            </Link>
          </div>
        )}

      </div>
    </div>
  );
}

export default OlvidePassword;