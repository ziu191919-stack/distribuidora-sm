import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../App.css";

function Resumen() {

  const [resumen, setResumen] = useState(null);

  const [mes, setMes] = useState(
    new Date().getMonth() + 1
  );

  const [anio, setAnio] = useState(
    new Date().getFullYear()
  );

  const navigate = useNavigate();

  useEffect(() => {
    obtenerResumen();
  }, [mes, anio]);

  const obtenerResumen = async () => {

    try {

      const respuesta = await fetch(
        `http://localhost:3000/resumen?mes=${mes}&anio=${anio}`
      );

      const datos = await respuesta.json();

      setResumen(datos);

    } catch (error) {

      console.error(error);

    }

  };

  if (!resumen) {

    return (
      <div className="container py-5">
        <h2>Cargando resumen...</h2>
      </div>
    );

  }

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
            <a
              href="/admin"
              className="admin-brand"
            >
              <span className="admin-brand-dot"></span>
              Distribuidora S.M
            </a>

            <span className="admin-badge-panel">
              Panel Admin
            </span>
          </div>

          <button
            className="btn-dashboard"
            onClick={() =>
              navigate("/admin")
            }
          >
            <i className="bi bi-speedometer2"></i>
            Dashboard
          </button>

        </div>

      </nav>

      <div className="admin-page-header">

        <div className="container d-flex justify-content-between align-items-center flex-wrap gap-3">

          <div>

            <h1 className="admin-page-title">
              Resumen General
            </h1>

            <p className="admin-page-sub">
              Indicadores por mes y año
            </p>

          </div>

          <div className="row g-2">

            <div className="col">

              <label className="form-label fw-bold">
                Mes
              </label>

              <select
                className="form-select"
                value={mes}
                onChange={(e) =>
                  setMes(e.target.value)
                }
              >
                <option value="1">Enero</option>
                <option value="2">Febrero</option>
                <option value="3">Marzo</option>
                <option value="4">Abril</option>
                <option value="5">Mayo</option>
                <option value="6">Junio</option>
                <option value="7">Julio</option>
                <option value="8">Agosto</option>
                <option value="9">Septiembre</option>
                <option value="10">Octubre</option>
                <option value="11">Noviembre</option>
                <option value="12">Diciembre</option>
              </select>

            </div>

            <div className="col">

              <label className="form-label fw-bold">
                Año
              </label>

              <select
                className="form-select"
                value={anio}
                onChange={(e) =>
                  setAnio(e.target.value)
                }
              >
                <option value="2025">2025</option>
                <option value="2026">2026</option>
                <option value="2027">2027</option>
                <option value="2028">2028</option>
              </select>

            </div>

          </div>

        </div>

      </div>

      <div className="container pb-5">

        <div className="row">

          <div className="col-md-3 mb-4">
            <div className="card shadow border-0 text-center p-4">
              <h6>Ventas Totales</h6>
              <h2 className="text-success fw-bold">
                ₡{Number(resumen.total_ventas).toLocaleString()}
              </h2>
            </div>
          </div>

          <div className="col-md-3 mb-4">
            <div className="card shadow border-0 text-center p-4">
              <h6>Pedidos</h6>
              <h2 className="text-primary fw-bold">
                {resumen.total_pedidos}
              </h2>
            </div>
          </div>

          <div className="col-md-3 mb-4">
            <div className="card shadow border-0 text-center p-4">
              <h6>Clientes</h6>
              <h2 className="text-info fw-bold">
                {resumen.total_clientes}
              </h2>
            </div>
          </div>

          <div className="col-md-3 mb-4">
            <div className="card shadow border-0 text-center p-4">
              <h6>Mayoristas</h6>
              <h2 className="text-warning fw-bold">
                {resumen.total_mayoristas}
              </h2>
            </div>
          </div>

        </div>

        <div className="row">

          <div className="col-md-6 mb-4">
            <div className="card shadow border-0 p-4 h-100">

              <h4>Producto Más Vendido</h4>

              <h3 className="text-success">
                {resumen.producto_mas_vendido?.nombre || "Sin datos"}
              </h3>

              <p>
                Total vendido:
                <strong>
                  {" "}
                  {resumen.producto_mas_vendido?.total_vendido || 0}
                </strong>
              </p>

            </div>
          </div>

          <div className="col-md-6 mb-4">
            <div className="card shadow border-0 p-4 h-100">

              <h4>Cliente Top</h4>

              <h3 className="text-primary">
                {resumen.cliente_top?.nombre || "Sin datos"}
              </h3>

              <p>
                Pedidos realizados:
                <strong>
                  {" "}
                  {resumen.cliente_top?.total_pedidos || 0}
                </strong>
              </p>

            </div>
          </div>

        </div>

      </div>

    </div>
  );
}

export default Resumen;