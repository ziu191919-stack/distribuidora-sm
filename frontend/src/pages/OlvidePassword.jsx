import { useState } from "react";
import { Link } from "react-router-dom";
import "../App.css";

function OlvidePassword() {
  const [cedula, setCedula] = useState("");
  const [email, setEmail] = useState("");
  const [paso, setPaso] = useState(1); // 1=form, 2=enviado
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!/^\d{9,12}$/.test(cedula)) { setError("La cédula debe tener entre 9 y 12 números"); return; }
    setCargando(true);
    try {
      const r = await fetch("http://localhost:3000/auth/clientes/olvide-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cedula, email }),
      });
      const datos = await r.json();
      if (!r.ok) { setError(datos.mensaje || "No se encontró la cuenta"); setCargando(false); return; }
      setPaso(2);
    } catch {
      setError("No se pudo conectar con el servidor");
    }
    setCargando(false);
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo"><i className="bi bi-key-fill"></i></div>
        <h2 className="auth-titulo">Recuperar contraseña</h2>

        {paso === 1 ? (
          <>
            <p className="auth-sub">Ingresa tu cédula y correo para recibir el enlace de recuperación</p>
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label fw-semibold">Cédula</label>
                <input type="text" className="form-control" placeholder="123456789"
                  value={cedula} onChange={(e) => setCedula(e.target.value.replace(/\D/g, ""))}
                  maxLength={12} required />
              </div>
              <div className="mb-3">
                <label className="form-label fw-semibold">Correo electrónico</label>
                <input type="email" className="form-control" placeholder="tucorreo@ejemplo.com"
                  value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              {error && <div className="alert alert-danger py-2 mb-3">{error}</div>}
              <button type="submit" className="btn btn-success w-100 py-2 fw-semibold" disabled={cargando}>
                {cargando ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="bi bi-send me-2"></i>}
                Enviar enlace
              </button>
            </form>
          </>
        ) : (
          <div className="text-center">
            <div style={{ fontSize: "3rem", color: "#40916c", marginBottom: "1rem" }}>
              <i className="bi bi-envelope-check-fill"></i>
            </div>
            <p className="text-muted">
              Si la cédula y el correo coinciden con una cuenta registrada, recibirás un enlace para restablecer tu contraseña.
              <br /><br />
              <strong>El enlace expira en 1 hora.</strong>
            </p>
          </div>
        )}

        <hr className="my-4" />
        <Link to="/login" className="btn btn-outline-success w-100">
          <i className="bi bi-arrow-left me-2"></i>
          Volver al login
        </Link>
      </div>
    </div>
  );
}

export default OlvidePassword;
