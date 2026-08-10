import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function Navbar() {
  const navigate = useNavigate();
  const [totalUnidades, setTotalUnidades] = useState(0);

  useEffect(() => {
    const actualizarContador = () => {
      try {
        const carrito = JSON.parse(localStorage.getItem("carrito")) || [];
        const total = carrito.reduce((t, p) => t + p.cantidad, 0);
        setTotalUnidades(total);
      } catch {
        setTotalUnidades(0);
      }
    };

    actualizarContador();

    window.addEventListener("carritoActualizado", actualizarContador);
    window.addEventListener("storage", actualizarContador);
    return () => {
      window.removeEventListener("carritoActualizado", actualizarContador);
      window.removeEventListener("storage", actualizarContador);
    };
  }, []);

  return (
    <nav className="navbar navbar-dark bg-success py-3">
      <div className="container">
        <Link className="navbar-brand fw-bold d-flex align-items-center gap-2" to="/">
          <span className="navbar-logo-icon">
            <i className="bi bi-droplet-fill"></i>
          </span>
          Distribuidora S.M
        </Link>
        <ul className="navbar-nav ms-auto d-flex flex-row gap-3 align-items-center">
          <li className="nav-item">
            <Link className="nav-link text-white" to="/#destacados">
              <i className="bi bi-star-fill me-1"></i>
              Destacados
            </Link>
          </li>
          <li className="nav-item">
            <button
              className="nav-link text-white border-0 bg-transparent position-relative"
              onClick={() => navigate("/pedido")}
              style={{ cursor: "pointer" }}
            >
              <i className="bi bi-cart-fill"></i>
              {totalUnidades > 0 && (
                <span
                  className="position-absolute badge rounded-pill bg-danger"
                  style={{ top: "-4px", right: "-10px", fontSize: "0.65rem" }}
                >
                  {totalUnidades}
                </span>
              )}
            </button>
          </li>
        </ul>
      </div>
    </nav>
  );
}
export default Navbar;