import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";

function DetalleProducto() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [producto, setProducto] = useState(null);
  const [cantidad, setCantidad] = useState(1);
  const [agregado, setAgregado] = useState(false);

  useEffect(() => {
    fetch(`http://localhost:3000/productos/${id}`)
      .then((r) => r.json())
      .then(setProducto)
      .catch(console.error);
  }, [id]);

  const agregarAlCarrito = () => {
    const carrito = JSON.parse(localStorage.getItem("carrito")) || [];
    const idx = carrito.findIndex((item) => item.id === producto.id);

    if (idx !== -1) {
      carrito[idx].cantidad += cantidad;
    } else {
      carrito.push({
        id: producto.id,
        nombre: producto.nombre,
        precio: producto.precio,
        imagen: producto.imagen,
        cantidad,
      });
    }

    localStorage.setItem("carrito", JSON.stringify(carrito));

    // Disparar evento para que Pedido.jsx detecte el cambio
    window.dispatchEvent(new Event("carritoActualizado"));

    setAgregado(true);
    setTimeout(() => setAgregado(false), 2000);
  };

  if (!producto) {
    return (
      <>
        <Navbar />
        <div className="container py-5 text-center">
          <h3>Cargando producto...</h3>
        </div>
      </>
    );
  }

  const mensajeWhatsapp = encodeURIComponent(
    `Hola, estoy interesado en el producto:\n\n${producto.nombre}\n\nPrecio: ₡${Number(producto.precio).toLocaleString()}`
  );

  return (
    <>
      <Navbar />
      <div className="container py-5">
        <button
          className="btn btn-outline-success mb-4"
          onClick={() => navigate("/catalogo")}
        >
          <i className="bi bi-arrow-left"></i> Volver al Catálogo
        </button>

        <div
          className="card border-0"
          style={{ borderRadius: "25px", overflow: "hidden", boxShadow: "0 15px 40px rgba(0,0,0,0.12)" }}
        >
          <div className="row g-0">
            <div className="col-md-6">
              <div style={{ background: "linear-gradient(180deg, #f8faf8 0%, #ffffff 100%)" }}>
                <img
                  src={`http://localhost:3000/${producto.imagen}`}
                  alt={producto.nombre}
                  className="img-fluid w-100"
                  style={{ height: "500px", objectFit: "contain", padding: "20px" }}
                />
              </div>
            </div>

            <div className="col-md-6 d-flex align-items-center">
              <div className="p-5 w-100">
                <span className="badge bg-success mb-3">{producto.categoria}</span>
                <h1 className="fw-bold mb-3">{producto.nombre}</h1>
                <p className="text-muted fs-5">{producto.descripcion}</p>

                <h2 className="text-success fw-bold my-3">
                  ₡{Number(producto.precio).toLocaleString()}
                </h2>

                {producto.precio_mayorista && Number(producto.precio_mayorista) > 0 && (
                  <div className="mb-3 p-2 rounded" style={{ background: "#d8f3dc" }}>
                    <i className="bi bi-star-fill text-success me-2"></i>
                    <strong>Precio mayorista:</strong>{" "}
                    ₡{Number(producto.precio_mayorista).toLocaleString()}
                    <span className="text-muted small ms-2">(pedidos 50+ unidades)</span>
                  </div>
                )}

                <p>
                  <strong>Stock disponible:</strong> {producto.stock}
                </p>

                <div className="my-4">
                  <label className="form-label fw-bold d-block mb-2">Cantidad</label>
                  <div className="d-flex align-items-center gap-3">
                    <button
                      className="btn btn-outline-danger"
                      onClick={() => setCantidad((c) => Math.max(1, c - 1))}
                    >−</button>
                    <span className="fw-bold fs-5" style={{ minWidth: "32px", textAlign: "center" }}>
                      {cantidad}
                    </span>
                    <button
                      className="btn btn-outline-success"
                      onClick={() => setCantidad((c) => Math.min(producto.stock, c + 1))}
                    >+</button>
                  </div>
                </div>

                <div className="d-flex flex-wrap gap-2">
                  <button
                    className={`btn btn-lg ${agregado ? "btn-success" : "btn-primary"}`}
                    onClick={agregarAlCarrito}
                    disabled={producto.stock === 0}
                  >
                    <i className={`bi bi-${agregado ? "check-circle" : "cart-plus"} me-2`}></i>
                    {agregado ? "Agregado" : "Agregar al carrito"}
                  </button>

                  <a
                    href={`https://wa.me/+50685280739?text=${mensajeWhatsapp}`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-success btn-lg"
                  >
                    <i className="bi bi-whatsapp me-2"></i>
                    WhatsApp
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default DetalleProducto;