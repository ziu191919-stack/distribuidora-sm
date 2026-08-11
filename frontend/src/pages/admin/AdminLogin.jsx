import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../App.css";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";

function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [verPassword, setVerPassword] = useState(false);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    if (!email.trim() || !password) {
      setError("Correo y contraseña requeridos");
      return;
    }
    setCargando(true);
    try {
      const r = await fetch(`${API_BASE}/auth/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const datos = await r.json();
      if (!r.ok) {
        setError(datos.mensaje || "Credenciales incorrectas");
        setCargando(false);
        return;
      }
      localStorage.setItem("token_admin", datos.token);
      if (datos.admin) localStorage.setItem("admin", JSON.stringify(datos.admin));
      navigate("/admin");
    } catch {
      setError("No se pudo conectar con el servidor");
      setCargando(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo" style={{ background: "rgba(26,58,42,0.08)" }}>
          <i className="bi bi-shield-lock-fill" style={{ color: "#1a3a2a" }}></i>
        </div>
        <h2 className="auth-titulo">Panel Admin</h2>
        <p className="auth-sub">Distribuidora S.M — Acceso restringido</p>

        <form onSubmit={handleLogin}>
          <div className="mb-3">
            <label className="form-label fw-semibold">Correo electrónico</label>
            <input
              type="email"
              className="form-control"
              placeholder="admin@distribuidorasm.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label fw-semibold">Contraseña</label>
            <div className="input-group">
              <input
                type={verPassword ? "text" : "password"}
                className="form-control"
                placeholder="Tu contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => setVerPassword(!verPassword)}
              >
                <i className={`bi bi-eye${verPassword ? "-slash" : ""}`}></i>
              </button>
            </div>
          </div>

          {error && <div className="alert alert-danger py-2 mb-3">{error}</div>}

          <button
            type="submit"
            className="btn btn-success w-100 py-2 fw-semibold"
            disabled={cargando}
          >
            {cargando
              ? <span className="spinner-border spinner-border-sm me-2"></span>
              : <i className="bi bi-box-arrow-in-right me-2"></i>}
            Ingresar
          </button>
        </form>
      </div>
    </div>
  );
}

export default AdminLogin;