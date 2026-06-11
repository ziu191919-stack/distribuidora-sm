import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import FacturaModal from "../../components/admin/FacturaModal";

function Facturas() {
  const navigate = useNavigate();
  const [facturas, setFacturas] = useState([]);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [facturaSeleccionada, setFacturaSeleccionada] = useState(null);
  const [busqueda, setBusqueda] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState("");
  const [fechaFiltro, setFechaFiltro] = useState("");

  useEffect(() => { obtenerFacturas(); }, []);

  const obtenerFacturas = async () => {
    try {
      const r = await fetch("http://localhost:3000/facturas");
      setFacturas(await r.json());
    } catch (e) { console.error(e); }
  };

  const verFactura = async (id) => {
    try {
      const r = await fetch(`http://localhost:3000/facturas/${id}`);
      setFacturaSeleccionada(await r.json());
      setMostrarModal(true);
    } catch (e) { console.error(e); }
  };

  const colorEstado = (estado) => ({
    pendiente:  { bg: "#fff3cd", color: "#856404" },
    enviado:    { bg: "#e2d9f3", color: "#5a3d8a" },
    en_entrega: { bg: "#d1e7dd", color: "#0f5132" },
    anulado:    { bg: "#f8d7da", color: "#842029" },
  }[estado] || { bg: "#f0f4f1", color: "#1a3a2a" });

  const etiqueta = (e) => ({
    pendiente: "Pendiente", enviado: "Enviado",
    en_entrega: "En entrega", anulado: "Anulado"
  }[e] || e);

  const facturasFiltradas = facturas.filter((f) => {
    const cb = f.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
      f.telefono?.toString().includes(busqueda);
    const ce = estadoFiltro === "" || f.estado === estadoFiltro;
    const cf = fechaFiltro === "" || f.fecha === fechaFiltro;
    return cb && ce && cf;
  });

  return (
    <div className="admin-wrapper">
      <nav className="admin-navbar">
        <div className="container">
          <div style={{ display: "flex", alignItems: "center" }}>
            <span className="admin-brand">
              <span className="admin-brand-dot"></span>Distribuidora S.M
            </span>
            <span className="admin-badge-panel">Facturas</span>
          </div>
          <button className="btn-dashboard" onClick={() => navigate("/admin")}>
            Dashboard
          </button>
        </div>
      </nav>

      <div className="admin-page-header">
        <div className="container">
          <h1 className="admin-page-title">Facturas</h1>
          <p className="admin-page-sub">Historial de ventas realizadas</p>
        </div>
      </div>

      <div className="container pb-5">
        {/* Filtros */}
        <div className="admin-card mb-4">
          <div className="row g-3">
            <div className="col-12 col-md-4">
              <input type="text" className="form-control"
                placeholder="Buscar cliente o teléfono..."
                value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
            </div>
            <div className="col-12 col-md-4">
              <select className="form-select" value={estadoFiltro}
                onChange={(e) => setEstadoFiltro(e.target.value)}>
                <option value="">Todos los estados</option>
                <option value="pendiente">Pendiente</option>
                <option value="enviado">Enviado</option>
                <option value="en_entrega">En entrega</option>
                <option value="anulado">Anulado</option>
              </select>
            </div>
            <div className="col-12 col-md-4">
              <input type="date" className="form-control"
                value={fechaFiltro} onChange={(e) => setFechaFiltro(e.target.value)} />
            </div>
          </div>
        </div>

        {facturasFiltradas.length === 0 ? (
          <div className="admin-card text-center py-5">
            <i className="bi bi-receipt" style={{ fontSize: "4rem", color: "#adb5bd" }}></i>
            <h4 className="mt-3">No se encontraron facturas</h4>
          </div>
        ) : (
          <div className="admin-lista">
            {facturasFiltradas.map((factura) => {
              const est = colorEstado(factura.estado);
              return (
                <div className="admin-fila" key={factura.id}>
                  <div className="admin-fila-header">
                    <div>
                      <span className="admin-fila-id">#{factura.id}</span>
                      <span className="admin-fila-nombre">{factura.nombre}</span>
                    </div>
                    <span className="admin-fila-badge" style={{ background: est.bg, color: est.color }}>
                      {etiqueta(factura.estado)}
                    </span>
                  </div>

                  <div className="admin-fila-datos">
                    <div className="admin-fila-dato">
                      <i className="bi bi-telephone"></i>
                      <span>{factura.telefono}</span>
                    </div>
                    <div className="admin-fila-dato">
                      <i className="bi bi-cash-coin"></i>
                      <span className="fw-bold text-success">
                        ₡{Number(factura.total).toLocaleString()}
                      </span>
                    </div>
                    <div className="admin-fila-dato">
                      <i className="bi bi-calendar3"></i>
                      <span>
                        {factura.fecha ? factura.fecha.split("-").reverse().join("/") : "-"}
                      </span>
                    </div>
                  </div>

                  <div className="admin-fila-acciones">
                    <button className="btn btn-success btn-sm" onClick={() => verFactura(factura.id)}>
                      <i className="bi bi-eye-fill me-1"></i>Ver detalle
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {mostrarModal && (
        <FacturaModal
          factura={facturaSeleccionada}
          cerrarModal={() => { setMostrarModal(false); setFacturaSeleccionada(null); }}
        />
      )}
    </div>
  );
}

export default Facturas;
