import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import "../App.css";

const REGEX_PASSWORD = /^(?=.*[0-9])(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;

function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [password, setPassword] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [verP, setVerP] = useState(false);
  const [verC, setVerC] = useState(false);
  const [error, setError] = useState("");
  const [exito, setExito] = useState(false);
  const [cargando, setCargando] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!REGEX_PASSWORD.test(password)) {
      setError("La contraseña debe tener al menos 8 caracteres, 1 número y 1 carácter especial");
      return;
    }
    if (password !== confirmar) { setError("Las contraseñas no coinciden"); return; }
    setCargando(true);
    try {
      const r = await fetch("http://localhost:3000/auth/clientes/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const datos = await r.json();
      if (!r.ok) { setError(datos.mensaje || "El enlace no es válido o expiró"); setCargando(false); return; }
      setExito(true);
      setTimeout(() => navigate("/login"), 3000);
    } catch {
      setError("No se pudo conectar con el servidor");
    }
    setCargando(false);
  };

  if (!token) return (
    <div className="auth-page">
      <div className="auth-card text-center">
        <div className="auth-logo"><i className="bi bi-x-circle-fill text-danger"></i></div>
        <h2 className="auth-titulo">Enlace inválido</h2>
        <p className="text-muted">Este enlace no es válido. Solicita uno nuevo.</p>
        <Link to="/olvide-password" className="btn btn-success w-100">Solicitar enlace</Link>
      </div>
    </div>
  );

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo"><i className="bi bi-shield-lock-fill"></i></div>
        <h2 className="auth-titulo">Nueva contraseña</h2>

        {exito ? (
          <div className="text-center">
            <div style={{ fontSize: "3rem", color: "#40916c" }}><i className="bi bi-check-circle-fill"></i></div>
            <p className="text-muted mt-3">Contraseña actualizada correctamente. Redirigiendo al login...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <p className="auth-sub">Crea una nueva contraseña segura</p>
            <div className="mb-3">
              <label className="form-label fw-semibold">Nueva contraseña</label>
              <div className="input-group">
                <input type={verP ? "text" : "password"} className="form-control"
                  value={password} onChange={(e) => setPassword(e.target.value)} required />
                <button type="button" className="btn btn-outline-secondary" onClick={() => setVerP(!verP)}>
                  <i className={`bi bi-eye${verP ? "-slash" : ""}`}></i>
                </button>
              </div>
              <small className="text-muted">Mín. 8 caracteres, 1 número y 1 especial</small>
            </div>
            <div className="mb-3">
              <label className="form-label fw-semibold">Confirmar contraseña</label>
              <div className="input-group">
                <input type={verC ? "text" : "password"} className="form-control"
                  value={confirmar} onChange={(e) => setConfirmar(e.target.value)} required />
                <button type="button" className="btn btn-outline-secondary" onClick={() => setVerC(!verC)}>
                  <i className={`bi bi-eye${verC ? "-slash" : ""}`}></i>
                </button>
              </div>
            </div>
            {error && <div className="alert alert-danger py-2 mb-3">{error}</div>}
            <button type="submit" className="btn btn-success w-100 py-2 fw-semibold" disabled={cargando}>
              {cargando ? <span className="spinner-border spinner-border-sm me-2"></span> : null}
              Actualizar contraseña
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default ResetPassword;
