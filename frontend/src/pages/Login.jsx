import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "../App.css";

function Login() {
  const [cedula, setCedula] = useState("");
  const [password, setPassword] = useState("");
  const [verPassword, setVerPassword] = useState(false);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);
  const navigate = useNavigate();

  const validarCedula = (v) => /^\d{9,12}$/.test(v);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (!validarCedula(cedula)) {
      setError("La cédula debe tener entre 9 y 12 números");
      return;
    }

    setCargando(true);
    try {
      const r = await fetch("http://localhost:3000/auth/clientes/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cedula, password }),
      });
      const datos = await r.json();
      if (!r.ok) { setError(datos.mensaje || "Credenciales incorrectas"); setCargando(false); return; }
      localStorage.setItem("token_cliente", datos.token);
      localStorage.setItem("cliente", JSON.stringify(datos.cliente));
      navigate("/");
    } catch {
      setError("No se pudo conectar con el servidor");
      setCargando(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo"><i className="bi bi-droplet-fill"></i></div>
        <h2 className="auth-titulo">Bienvenido</h2>
        <p className="auth-sub">Distribuidora S.M — Inicia sesión</p>

        <form onSubmit={handleLogin}>
          <div className="mb-3">
            <label className="form-label fw-semibold">Cédula</label>
            <input type="text" className="form-control" placeholder="Ej: 123456789"
              value={cedula} onChange={(e) => setCedula(e.target.value.replace(/\D/g, ""))}
              maxLength={12} required />
            <small className="text-muted">Solo números, 9 a 12 dígitos</small>
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
              <button type="button" className="btn btn-outline-secondary"
                onClick={() => setVerPassword(!verPassword)}>
                <i className={`bi bi-eye${verPassword ? "-slash" : ""}`}></i>
              </button>
            </div>
          </div>

          {error && <div className="alert alert-danger py-2 mb-3">{error}</div>}

          <button type="submit" className="btn btn-success w-100 py-2 fw-semibold" disabled={cargando}>
            {cargando
              ? <span className="spinner-border spinner-border-sm me-2"></span>
              : <i className="bi bi-box-arrow-in-right me-2"></i>}
            Iniciar sesión
          </button>
        </form>

        <div className="text-center mt-3">
          <Link to="/olvide-password" className="text-success small fw-semibold">
            ¿Olvidaste tu contraseña?
          </Link>
        </div>

        <hr className="my-4" />
        <p className="text-center text-muted mb-2">¿No tienes cuenta?</p>
        <Link to="/registro" className="btn btn-outline-success w-100">Crear cuenta</Link>
      </div>
    </div>
  );
}

export default Login;
