import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import "../App.css";

function MiCuenta() {
  const [cliente, setCliente] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token_cliente");
    const datos = localStorage.getItem("cliente");

    if (!token || !datos) {
      navigate("/login");
      return;
    }

    setCliente(JSON.parse(datos));
  }, [navigate]);

  const cerrarSesion = () => {
    localStorage.removeItem("token_cliente");
    localStorage.removeItem("cliente");
    navigate("/login");
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

          <div className="mb-3">
            <label className="form-label text-muted small mb-1">Cédula</label>
            <div className="form-control bg-light">{cliente.cedula}</div>
          </div>

          <div className="mb-3">
            <label className="form-label text-muted small mb-1">Teléfono</label>
            <div className="form-control bg-light">{cliente.telefono}</div>
          </div>

          {cliente.direccion && (
            <div className="mb-4">
              <label className="form-label text-muted small mb-1">Dirección</label>
              <div className="form-control bg-light">{cliente.direccion}</div>
            </div>
          )}

          <hr className="my-4" />

          <div className="d-flex flex-column gap-2">
            <Link to="/pedido" className="btn btn-success w-100">
              <i className="bi bi-cart-fill me-2"></i>
              Mi Carrito
            </Link>
            <Link to="/catalogo" className="btn btn-outline-success w-100">
              <i className="bi bi-grid-3x3-gap-fill me-2"></i>
              Ver Catálogo
            </Link>
            <button
              className="btn btn-outline-danger w-100"
              onClick={cerrarSesion}
            >
              <i className="bi bi-box-arrow-right me-2"></i>
              Cerrar sesión
            </button>
          </div>

          <div className="text-center mt-3">
            <Link to="/" className="text-muted small">
              <i className="bi bi-house-fill me-1"></i>
              Volver al inicio
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}

export default MiCuenta;
