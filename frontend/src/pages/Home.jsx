import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import bannerPrincipal from "../assets/banner-principal.png.png";
import "../App.css";
import { Carousel } from "bootstrap";

function Home() {
  const [productosDestacados, setProductosDestacados] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    obtenerDestacados();
  }, []);

  useEffect(() => {
    if (productosDestacados.length > 0) {
      const elemento = document.getElementById("carouselDestacados");
      if (elemento) {
        new Carousel(elemento, { interval: 3000, wrap: true, touch: true });
      }
    }
  }, [productosDestacados]);

  const obtenerDestacados = async () => {
    try {
      const respuesta = await fetch("http://localhost:3000/productos/destacados");
      const datos = await respuesta.json();
      setProductosDestacados(datos);
    } catch (error) {
      console.error("Error cargando productos destacados:", error);
    }
  };

  return (
    <>
      <Navbar />

      {/* HERO */}
      <section className="hero-wrapper">
        <div className="hero-imagen">
          <img src={bannerPrincipal} alt="Distribuidora S.M" />
        </div>
        <div className="hero-texto">
          <span className="hero-badge">Distribuidora S.M</span>
          <h1 className="hero-titulo">
            Limpieza que
            <span> inspira confianza</span>
          </h1>
          <p className="hero-subtitulo">
            Productos de limpieza y desinfección para hogares, negocios, sodas,
            restaurantes y comercios de Costa Rica.
          </p>
        </div>
      </section>

      {/* MODULOS DE ACCESO RAPIDO */}
      <section className="container py-5">
        <h2 className="text-center fw-bold mb-2" style={{ color: "#1a3a2a" }}>
          ¿Qué desea hacer?
        </h2>
        <p className="text-center text-muted mb-4">
          Acceda rápidamente a lo que necesita
        </p>

        <div className="row justify-content-center g-3">

          <div className="col-6 col-md-3">
            <div
              className="app-modulo"
              onClick={() => navigate("/catalogo")}
            >
              <div className="app-modulo-icono">
                <i className="bi bi-grid-3x3-gap-fill"></i>
              </div>
              <span>Ver Catálogo</span>
            </div>
          </div>

          <div className="col-6 col-md-3">
            <div
              className="app-modulo"
              onClick={() => navigate("/pedido")}
            >
              <div className="app-modulo-icono">
                <i className="bi bi-cart-fill"></i>
              </div>
              <span>Mi Carrito</span>
            </div>
          </div>

          <div className="col-6 col-md-3">
            <div
              className="app-modulo"
              onClick={() => navigate("/mi-cuenta")}
            >
              <div className="app-modulo-icono">
                <i className="bi bi-person-fill"></i>
              </div>
              <span>Mi Cuenta</span>
            </div>
          </div>

          <div className="col-6 col-md-3">
            <div
              className="app-modulo"
              onClick={() =>
                window.open("https://wa.me/+50685280739", "_blank")
              }
            >
              <div className="app-modulo-icono app-modulo-icono--verde">
                <i className="bi bi-whatsapp"></i>
              </div>
              <span>WhatsApp</span>
            </div>
          </div>

        </div>
      </section>

      {/* PRODUCTOS DESTACADOS */}
      <section className="container destacados-section">
        <h2 className="text-center fw-bold mb-5">Productos Destacados</h2>

        {productosDestacados.length === 0 ? (
          <p className="text-center text-muted py-4">Cargando productos...</p>
        ) : (
          <>
            <div
              id="carouselDestacados"
              className="carousel slide position-relative px-4"
              data-bs-ride="carousel"
            >
              <div className="carousel-indicators" style={{ bottom: "-2.5rem" }}>
                {productosDestacados.map((producto, index) => (
                  <button
                    key={producto.id}
                    type="button"
                    data-bs-target="#carouselDestacados"
                    data-bs-slide-to={index}
                    className={index === 0 ? "active" : ""}
                  />
                ))}
              </div>

              <div className="carousel-inner">
                {productosDestacados.map((producto, index) => (
                  <div
                    key={producto.id}
                    className={`carousel-item ${index === 0 ? "active" : ""}`}
                  >
                    <div className="producto-slide-card">
                      <div className="producto-imagen-wrap">
                        <img
                          src={`http://localhost:3000/${producto.imagen}`}
                          alt={producto.nombre}
                        />
                      </div>
                      <div className="producto-info text-center">
                        <h2 className="fw-bold mb-3">{producto.nombre}</h2>
                        <p className="lead">{producto.descripcion}</p>
                        <h3 className="text-success fw-bold mb-4">
                          ₡{Number(producto.precio).toLocaleString()}
                        </h3>
                        <button
                          className="btn btn-success btn-lg"
                          onClick={() => navigate(`/producto/${producto.id}`)}
                        >
                          Ver Detalle
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button
                className="carousel-control-prev"
                type="button"
                data-bs-target="#carouselDestacados"
                data-bs-slide="prev"
              >
                <span className="carousel-control-prev-icon"></span>
              </button>
              <button
                className="carousel-control-next"
                type="button"
                data-bs-target="#carouselDestacados"
                data-bs-slide="next"
              >
                <span className="carousel-control-next-icon"></span>
              </button>
            </div>

            <div className="text-center mt-5">
              <button
                className="btn btn-success btn-lg"
                onClick={() => navigate("/catalogo")}
              >
                <i className="bi bi-bag-fill me-2"></i>
                Ver Todos los Productos
              </button>
            </div>
          </>
        )}
      </section>

      {/* ACERCA DE */}
      <section className="container py-5 mt-4">
        <div className="acerca-de-card">
          <div className="row align-items-center">
            <div className="col-md-8">
              <h3 className="fw-bold mb-3" style={{ color: "#1a3a2a" }}>
                Acerca de Distribuidora S.M
              </h3>
              <p className="text-muted mb-2">
                Somos una empresa costarricense dedicada a la distribución de
                productos de limpieza y desinfección de alta calidad para
                hogares, negocios, sodas, restaurantes y comercios en todo
                Costa Rica.
              </p>
              <p className="text-muted mb-0">
                Ofrecemos servicio personalizado, entregas rápidas y precios
                competitivos con pago contra entrega para su comodidad.
              </p>
            </div>
            <div className="col-md-4 text-center mt-4 mt-md-0">
              <div className="beneficio-icono mx-auto mb-2" style={{ width: "80px", height: "80px", fontSize: "2rem" }}>
                <i className="bi bi-award-fill"></i>
              </div>
              <p className="fw-bold text-success mb-0">Calidad garantizada</p>
              <small className="text-muted">Desde Costa Rica para Costa Rica</small>
            </div>
          </div>
        </div>
      </section>

      {/* WHATSAPP */}
      <a
        href="https://wa.me/+50685280739"
        className="whatsapp-float"
        target="_blank"
        rel="noreferrer"
        aria-label="Contactar por WhatsApp"
      >
        <i className="bi bi-whatsapp"></i>
      </a>
    </>
  );
}

export default Home;
