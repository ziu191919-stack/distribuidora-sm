import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../App.css";

function AdminDashboard() {

  const navigate = useNavigate();

  const [stockBajo, setStockBajo] = useState([]);

  useEffect(() => {
    obtenerStockBajo();
  }, []);

  const obtenerStockBajo = async () => {

    try {

      const respuesta = await fetch(
        "http://localhost:3000/productos/stock-bajo"
      );

      const datos = await respuesta.json();

      setStockBajo(datos);

    } catch (error) {

      console.error(error);

    }

  };

  return (
    <div className="admin-wrapper">

      <nav className="admin-navbar">

        <div className="container">

          <div
            style={{
              display: "flex",
              alignItems: "center"
            }}
          >

            <span className="admin-brand">
              <span className="admin-brand-dot"></span>
              Distribuidora S.M
            </span>

            <span className="admin-badge-panel">
              Panel Admin
            </span>

          </div>

        </div>

      </nav>

      <div className="container py-5">

        <h1 className="text-center fw-bold mb-4">
          Panel Administrativo
        </h1>

        {stockBajo.length > 0 && (

          <div className="alert alert-warning shadow-sm mb-5">

            <h5 className="fw-bold mb-3">
              ⚠ Productos con stock bajo ({stockBajo.length})
            </h5>

            {stockBajo.map((producto) => (

              <div
                key={producto.id}
                className="mb-2"
              >
                <strong>
                  {producto.nombre}
                </strong>

                {" - Stock: "}

                {producto.stock}

                {" / Mínimo: "}

                {producto.stock_minimo}

              </div>

            ))}

          </div>

        )}

        <div className="row">

          {/* INVENTARIO */}
          <div className="col-lg-4 col-md-6 mb-4">

            <div
              className="card border-0 shadow h-100 text-center p-4"
              style={{
                cursor: "pointer",
                borderRadius: "20px"
              }}
              onClick={() => navigate("/inventario")}
            >
              <i
                className="bi bi-box-seam text-success"
                style={{
                  fontSize: "4rem"
                }}
              ></i>

              <h3 className="mt-3">
                Inventario
              </h3>

              <p className="text-muted">
                Administrar productos e inventario.
              </p>

            </div>

          </div>

          {/* PEDIDOS */}
          <div className="col-lg-4 col-md-6 mb-4">

            <div
              className="card border-0 shadow h-100 text-center p-4"
              style={{
                cursor: "pointer",
                borderRadius: "20px"
              }}
              onClick={() => navigate("/admin/pedidos")}
            >
              <i
                className="bi bi-cart-check text-primary"
                style={{
                  fontSize: "4rem"
                }}
              ></i>

              <h3 className="mt-3">
                Pedidos
              </h3>

              <p className="text-muted">
                Gestión de pedidos realizados por clientes.
              </p>

            </div>

          </div>

          {/* CLIENTES */}
          <div className="col-lg-4 col-md-6 mb-4">

            <div
              className="card border-0 shadow h-100 text-center p-4"
              style={{
                cursor: "pointer",
                borderRadius: "20px"
              }}
              onClick={() => navigate("/admin/clientes")}
            >
              <i
                className="bi bi-people-fill text-info"
                style={{
                  fontSize: "4rem"
                }}
              ></i>

              <h3 className="mt-3">
                Clientes
              </h3>

              <p className="text-muted">
                Administración de clientes registrados.
              </p>

            </div>

          </div>

          {/* RESUMEN */}
          <div className="col-lg-4 col-md-6 mb-4">

            <div
              className="card border-0 shadow h-100 text-center p-4"
              style={{
                cursor: "pointer",
                borderRadius: "20px"
              }}
              onClick={() => navigate("/admin/resumen")}
            >
              <i
                className="bi bi-graph-up-arrow text-warning"
                style={{
                  fontSize: "4rem"
                }}
              ></i>

              <h3 className="mt-3">
                Resumen
              </h3>

              <p className="text-muted">
                Ventas, clientes y productos más vendidos.
              </p>

            </div>

          </div>

          {/* FACTURAS */}
          <div className="col-lg-4 col-md-6 mb-4">

            <div
              className="card border-0 shadow h-100 text-center p-4"
              style={{
                cursor: "pointer",
                borderRadius: "20px"
              }}
              onClick={() => navigate("/admin/facturas")}
            >
              <i
                className="bi bi-receipt text-danger"
                style={{
                  fontSize: "4rem"
                }}
              ></i>

              <h3 className="mt-3">
                Facturas
              </h3>

              <p className="text-muted">
                Consulta de facturas y ventas realizadas.
              </p>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}

export default AdminDashboard;