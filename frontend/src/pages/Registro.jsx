import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "../App.css";

const REGEX_PASSWORD = /^(?=.*[0-9])(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;

function Registro() {
  const [nombre, setNombre] = useState("");
  const [cedula, setCedula] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [direccion, setDireccion] = useState("");
  const [password, setPassword] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [verPassword, setVerPassword] = useState(false);
  const [verConfirmar, setVerConfirmar] = useState(false);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);
  const navigate = useNavigate();

  const handleRegistro = async (e) => {
    e.preventDefault();
    setError("");

    if (!/^\d{9,12}$/.test(cedula)) {
      setError("La cédula debe tener entre 9 y 12 números");
      return;
    }
    if (!/^\d{8}$/.test(telefono)) {
      setError("El teléfono debe tener exactamente 8 dígitos");
      return;
    }
    if (!REGEX_PASSWORD.test(password)) {
      setError("La contraseña debe tener al menos 8 caracteres, 1 número y 1 carácter especial (ej: @#$%)");
      return;
    }
    if (password !== confirmar) {
      setError("Las contraseñas no coinciden");
      return;
    }

    setCargando(true);
    try {
      const r = await fetch("http://localhost:3000/auth/clientes/registro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, cedula, email, telefono, direccion, password }),
      });
      const datos = await r.json();
      if (!r.ok) {
        setError(datos.mensaje || "Error al registrarse");
        setCargando(false);
        return;
      }
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
      <div className="auth-card" style={{ maxWidth: "500px" }}>
        <div className="auth-logo"><i className="bi bi-person-plus-fill"></i></div>
        <h2 className="auth-titulo">Crear cuenta</h2>
        <p className="auth-sub">Regístrate en Distribuidora S.M</p>

        <form onSubmit={handleRegistro}>
          <div className="mb-3">
            <label className="form-label fw-semibold">Nombre completo</label>
            <input
              type="text" className="form-control"
              placeholder="Tu nombre completo"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required minLength={3}
            />
          </div>

          <div className="row g-2 mb-3">
            <div className="col-6">
              <label className="form-label fw-semibold">Cédula</label>
              <input
                type="text" className="form-control"
                placeholder="123456789"
                value={cedula}
                onChange={(e) => setCedula(e.target.value.replace(/\D/g, ""))}
                maxLength={12} required
              />
            </div>
            <div className="col-6">
              <label className="form-label fw-semibold">Teléfono</label>
              <input
                type="text" className="form-control"
                placeholder="88001234"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value.replace(/\D/g, ""))}
                maxLength={8} required
              />
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label fw-semibold">Correo electrónico</label>
            <input
              type="email" className="form-control"
              placeholder="tucorreo@ejemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label fw-semibold">Dirección de entrega</label>
            <input
              type="text" className="form-control"
              placeholder="Provincia, cantón, señas"
              value={direccion}
              onChange={(e) => setDireccion(e.target.value)}
            />
          </div>

          <div className="mb-2">
            <label className="form-label fw-semibold">Contraseña</label>
            <div className="input-group">
              <input
                type={verPassword ? "text" : "password"}
                className="form-control"
                placeholder="Mín. 8 caracteres, 1 número, 1 especial"
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
            <small className="text-muted">
              <i className="bi bi-info-circle me-1"></i>
              Mínimo 8 caracteres, al menos 1 número y 1 especial (ej: @#$%)
            </small>
          </div>

          <div className="mb-3">
            <label className="form-label fw-semibold">Confirmar contraseña</label>
            <div className="input-group">
              <input
                type={verConfirmar ? "text" : "password"}
                className="form-control"
                placeholder="Repite tu contraseña"
                value={confirmar}
                onChange={(e) => setConfirmar(e.target.value)}
                required
              />
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => setVerConfirmar(!verConfirmar)}
              >
                <i className={`bi bi-eye${verConfirmar ? "-slash" : ""}`}></i>
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
              : <i className="bi bi-person-check-fill me-2"></i>}
            Registrarme
          </button>
        </form>

        <hr className="my-4" />
        <p className="text-center text-muted mb-2">¿Ya tienes cuenta?</p>
        <Link to="/login" className="btn btn-outline-success w-100">Iniciar sesión</Link>
      </div>
    </div>
  );
}

export default Registro;
