import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import "../App.css";

function Catalogo() {
  const [productos, setProductos] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetch("http://localhost:3000/productos")
      .then((r) => r.json())
      .then(setProductos)
      .catch(console.error);
  }, []);

  const productosFiltrados = productos.filter((p) =>
    p.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <>
      <Navbar />

      <div className="catalogo-header">
        <div className="container">
          <button className="btn-volver" onClick={() => navigate("/")}>
            <i className="bi bi-arrow-left"></i> Inicio
          </button>
          <h1 className="catalogo-titulo">Catálogo de Productos</h1>
          <p className="catalogo-sub">
            {productosFiltrados.length} producto{productosFiltrados.length !== 1 ? "s" : ""} disponible{productosFiltrados.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      <div className="container catalogo-contenido">
        <div className="row justify-content-center mb-5">
          <div className="col-12 col-md-6">
            <div className="search-wrapper">
              <i className="bi bi-search"></i>
              <input
                type="text" className="search-input"
                placeholder="Buscar producto..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>
          </div>
        </div>

        {productosFiltrados.length === 0 ? (
          <p className="text-center text-muted py-5">No se encontraron productos.</p>
        ) : (
          <div className="row">
            {productosFiltrados.map((producto) => (
              <div className="col-6 col-md-4 col-lg-3 mb-4" key={producto.id}>
                <div className="catalogo-card">
                  <div className="catalogo-card-img">
                    <img
                      src={`http://localhost:3000/${producto.imagen}`}
                      alt={producto.nombre}
                    />
                  </div>
                  <div className="catalogo-card-body">
                    <h5 className="catalogo-card-nombre">{producto.nombre}</h5>
                    <p className="catalogo-card-desc">{producto.descripcion}</p>
                    <div className="catalogo-card-footer">
                      <div>
                        <span className="catalogo-card-precio">
                          ₡{Number(producto.precio).toLocaleString()}
                        </span>
                        {producto.precio_mayorista && Number(producto.precio_mayorista) > 0 && (
                          <div className="catalogo-card-mayorista">
                            <i className="bi bi-star-fill me-1"></i>
                            Mayorista: ₡{Number(producto.precio_mayorista).toLocaleString()}
                          </div>
                        )}
                      </div>
                      <button
                        className="catalogo-card-btn"
                        onClick={() => navigate(`/producto/${producto.id}`)}
                      >
                        Ver <i className="bi bi-arrow-right"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export default Catalogo;
