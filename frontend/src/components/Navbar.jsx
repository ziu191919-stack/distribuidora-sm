import { Link } from "react-router-dom";

function Navbar() {
  return (
    <nav className="navbar navbar-dark bg-success py-3">
      <div className="container">
        <Link className="navbar-brand fw-bold" to="/">
          Distribuidora S.M
        </Link>

        <ul className="navbar-nav ms-auto d-flex flex-row gap-3 align-items-center">
          <li className="nav-item">
            <Link className="nav-link text-white" to="/#destacados">
              <i className="bi bi-star-fill me-1"></i>
              Destacados
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  );
}

export default Navbar;
