import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ClienteModal from "../../components/admin/ClienteModal";
import "../../App.css";

function Clientes() {
  const [clientes, setClientes] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [mostrarModal, setMostrarModal] = useState(false);
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const navigate = useNavigate();

  useEffect(() => { obtenerClientes(); }, []);

  const obtenerClientes = async () => {
    try {
      const r = await fetch("http://localhost:3000/clientes");
      setClientes(await r.json());
    } catch (e) { console.error(e); }
  };

  const guardarCliente = async (cliente) => {
    try {
      await fetch(`http://localhost:3000/clientes/${cliente.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cliente),
      });
      await obtenerClientes();
      setMostrarModal(false);
      setClienteSeleccionado(null);
    } catch (e) { console.error(e); }
  };

  const desactivarCliente = async (id) => {
    if (!window.confirm("¿Desea desactivar este cliente?")) return;
    try {
      await fetch(`http://localhost:3000/clientes/desactivar/${id}`, { method: "PUT" });
      await obtenerClientes();
    } catch (e) { console.error(e); }
  };

  const clientesFiltrados = clientes.filter((c) =>
    c.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
    c.telefono?.includes(busqueda) ||
    c.cedula?.includes(busqueda)
  );

  return (
    <div className="admin-wrapper">
      <nav className="admin-navbar">
        <div className="container">
          <div style={{ display: "flex", alignItems: "center" }}>
            <span className="admin-brand">
              <span className="admin-brand-dot"></span>Distribuidora S.M
            </span>
            <span className="admin-badge-panel">Clientes</span>
          </div>
          <button className="btn-dashboard" onClick={() => navigate("/admin")}>
            Dashboard
          </button>
        </div>
      </nav>

      <div className="admin-page-header">
        <div className="container">
          <h1 className="admin-page-title">Gestión de Clientes</h1>
          <p className="admin-page-sub">{clientes.length} clientes registrados</p>
        </div>
      </div>

      <div className="container pb-5">
        <div className="search-wrapper">
          <i className="bi bi-search"></i>
          <input
            type="text" className="search-input"
            placeholder="Buscar por nombre, teléfono o cédula..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>

        {clientesFiltrados.length === 0 ? (
          <div className="admin-card text-center py-5">
            <i className="bi bi-people" style={{ fontSize: "4rem", color: "#adb5bd" }}></i>
            <h4 className="mt-3">No se encontraron clientes</h4>
          </div>
        ) : (
          <div className="admin-lista">
            {clientesFiltrados.map((cliente) => (
              <div className="admin-fila" key={cliente.id}>
                <div className="admin-fila-header">
                  <div>
                    <span className="admin-fila-id">#{cliente.id}</span>
                    <span className="admin-fila-nombre">{cliente.nombre}</span>
                  </div>
                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                    {cliente.es_mayorista === 1 && (
                      <span className="admin-fila-badge" style={{ background: "#d1e7dd", color: "#0f5132" }}>
                        Mayorista
                      </span>
                    )}
                    <span
                      className="admin-fila-badge"
                      style={
                        cliente.password_hash
                          ? { background: "#cfe2ff", color: "#084298" }
                          : { background: "#f0f4f1", color: "#6c757d" }
                      }
                    >
                      {cliente.password_hash ? "Con cuenta" : "Sin cuenta"}
                    </span>
                  </div>
                </div>

                <div className="admin-fila-datos">
                  {cliente.cedula && (
                    <div className="admin-fila-dato">
                      <i className="bi bi-person-badge"></i>
                      <span>{cliente.cedula}</span>
                    </div>
                  )}
                  <div className="admin-fila-dato">
                    <i className="bi bi-telephone"></i>
                    <span>{cliente.telefono}</span>
                  </div>
                  {cliente.email && (
                    <div className="admin-fila-dato">
                      <i className="bi bi-envelope"></i>
                      <span>{cliente.email}</span>
                    </div>
                  )}
                  {cliente.direccion && (
                    <div className="admin-fila-dato">
                      <i className="bi bi-geo-alt"></i>
                      <span>{cliente.direccion}</span>
                    </div>
                  )}
                </div>

                <div className="admin-fila-acciones">
                  <button
                    className="btn btn-success btn-sm"
                    onClick={() => { setClienteSeleccionado(cliente); setMostrarModal(true); }}
                  >
                    <i className="bi bi-pencil-square me-1"></i>Editar
                  </button>
                  <button
                    className="btn btn-outline-danger btn-sm"
                    onClick={() => desactivarCliente(cliente.id)}
                  >
                    <i className="bi bi-slash-circle me-1"></i>Desactivar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {mostrarModal && (
        <ClienteModal
          cliente={clienteSeleccionado}
          cerrarModal={() => { setMostrarModal(false); setClienteSeleccionado(null); }}
          guardarCliente={guardarCliente}
        />
      )}
    </div>
  );
}

export default Clientes;
