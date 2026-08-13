import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function Navbar() {
  const navigate = useNavigate();
  const [totalUnidades, setTotalUnidades] = useState(0);
  const [modoAccesible, setModoAccesible] = useState(false);

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

  // Accesibilidad: modo de texto grande + alto contraste, se recuerda entre visitas
  useEffect(() => {
    const guardado = localStorage.getItem("modoAccesible") === "true";
    setModoAccesible(guardado);
    document.documentElement.classList.toggle("modo-accesible", guardado);
  }, []);

  const alternarModoAccesible = () => {
    const nuevoValor = !modoAccesible;
    setModoAccesible(nuevoValor);
    document.documentElement.classList.toggle("modo-accesible", nuevoValor);
    localStorage.setItem("modoAccesible", nuevoValor);
  };

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
            <button
              className="btn-accesibilidad"
              onClick={alternarModoAccesible}
              aria-label={modoAccesible ? "Desactivar modo de texto grande y alto contraste" : "Activar modo de texto grande y alto contraste"}
              aria-pressed={modoAccesible}
              title="Texto grande y alto contraste"
            >
              <i className="bi bi-universal-access-circle"></i>
              <span className="d-none d-md-inline ms-1">Accesibilidad</span>
            </button>
          </li>
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
              aria-label={`Ver carrito, ${totalUnidades} unidades`}
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