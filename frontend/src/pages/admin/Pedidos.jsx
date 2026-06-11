import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../App.css";

function Pedidos() {
  const [pedidos, setPedidos] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    obtenerPedidos();
    const iv = setInterval(obtenerPedidos, 5000);
    return () => clearInterval(iv);
  }, []);

  const obtenerPedidos = async () => {
    try {
      const r = await fetch("http://localhost:3000/pedidos");
      setPedidos(await r.json());
    } catch (e) { console.error(e); }
  };

  const actualizarEstado = async (id, estado) => {
    try {
      await fetch(`http://localhost:3000/pedidos/estado/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado }),
      });
      obtenerPedidos();
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

  const pedidosFiltrados = pedidos.filter((p) =>
    p.nombre?.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="admin-wrapper">
      <nav className="admin-navbar">
        <div className="container">
          <div style={{ display: "flex", alignItems: "center" }}>
            <span className="admin-brand">
              <span className="admin-brand-dot"></span>Distribuidora S.M
            </span>
            <span className="admin-badge-panel">Pedidos</span>
          </div>
          <button className="btn-dashboard" onClick={() => navigate("/admin")}>
            Dashboard
          </button>
        </div>
      </nav>

      <div className="admin-page-header">
        <div className="container">
          <h1 className="admin-page-title">Gestión de Pedidos</h1>
          <p className="admin-page-sub">
            {pedidosFiltrados.length} pedido{pedidosFiltrados.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      <div className="container pb-5">
        <div className="search-wrapper">
          <i className="bi bi-search"></i>
          <input
            type="text" className="search-input"
            placeholder="Buscar cliente..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>

        {pedidosFiltrados.length === 0 ? (
          <div className="admin-card text-center py-5">
            <i className="bi bi-cart-x" style={{ fontSize: "4rem", color: "#adb5bd" }}></i>
            <h4 className="mt-3">No hay pedidos registrados</h4>
          </div>
        ) : (
          <div className="admin-lista">
            {pedidosFiltrados.map((pedido) => {
              const est = colorEstado(pedido.estado);
              return (
                <div className="admin-fila" key={pedido.id}>
                  <div className="admin-fila-header">
                    <div>
                      <span className="admin-fila-id">#{pedido.id}</span>
                      <span className="admin-fila-nombre">{pedido.nombre}</span>
                    </div>
                    <span className="admin-fila-badge" style={{ background: est.bg, color: est.color }}>
                      {etiqueta(pedido.estado)}
                    </span>
                  </div>

                  <div className="admin-fila-datos">
                    <div className="admin-fila-dato">
                      <i className="bi bi-telephone"></i>
                      <span>{pedido.telefono}</span>
                    </div>
                    <div className="admin-fila-dato">
                      <i className="bi bi-credit-card"></i>
                      <span>{pedido.metodo_pago}</span>
                    </div>
                    <div className="admin-fila-dato">
                      <i className="bi bi-cash-coin"></i>
                      <span className="fw-bold text-success">
                        ₡{Number(pedido.total).toLocaleString()}
                      </span>
                    </div>
                    <div className="admin-fila-dato">
                      <i className="bi bi-calendar3"></i>
                      <span>{new Date(pedido.creado_en).toLocaleDateString("es-CR")}</span>
                    </div>
                  </div>

                  <div className="admin-fila-acciones">
                    <label className="admin-fila-label">Cambiar estado:</label>
                    <select
                      value={pedido.estado}
                      onChange={(e) => actualizarEstado(pedido.id, e.target.value)}
                      className="admin-select-estado"
                      style={{ background: est.bg, color: est.color }}
                    >
                      <option value="pendiente">Pendiente</option>
                      <option value="enviado">Enviado</option>
                      <option value="en_entrega">En entrega</option>
                      <option value="anulado">Anulado</option>
                    </select>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default Pedidos;
