import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ClienteModal from "../../components/admin/ClienteModal";
import "../../App.css";
import AdminNavbar from "../../components/admin/AdminNavbar";

const API = "http://localhost:3000";

const authHeaders = () => {
  const token = localStorage.getItem("token_admin");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

function Clientes() {
  const [clientes, setClientes]                   = useState([]);
  const [busqueda, setBusqueda]                   = useState("");
  const [mostrarModal, setMostrarModal]           = useState(false);
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const navigate = useNavigate();

  useEffect(() => { obtenerClientes(); }, []);

  const obtenerClientes = async () => {
    try {
      const r = await fetch(`${API}/clientes`);
      setClientes(await r.json());
    } catch (e) { console.error(e); }
  };

  const guardarCliente = async (cliente) => {
    try {
      await fetch(`${API}/clientes/${cliente.id}`, {
        method: "PUT",
        headers: authHeaders(),
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
      await fetch(`${API}/clientes/desactivar/${id}`, { method: "PUT", headers: authHeaders() });
      await obtenerClientes();
    } catch (e) { console.error(e); }
  };

  const toggler2FA = async (cliente) => {
    const accion = cliente.twofa_activo ? "desactivar" : "activar";
    const mensaje = cliente.twofa_activo
      ? "¿Desactivar la doble autenticación de este cliente? Podrá entrar sin verificación."
      : "¿Activar la doble autenticación de este cliente?";
    if (!window.confirm(mensaje)) return;
    try {
      await fetch(`${API}/auth/clientes/admin/2fa/${accion}/${cliente.id}`, { method: "PUT", headers: authHeaders() });
      await obtenerClientes();
    } catch (e) { console.error(e); }
  };

  const resetearGoogleAuth = async (cliente) => {
    if (!window.confirm(`¿Resetear Google Authenticator de ${cliente.nombre}? El cliente deberá volver a configurarlo.`)) return;
    try {
      await fetch(`${API}/auth/clientes/admin/totp/resetear/${cliente.id}`, { method: "PUT", headers: authHeaders() });
      await obtenerClientes();
    } catch (e) { console.error(e); }
  };

  const clientesFiltrados = clientes.filter((c) =>
    c.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
    c.telefono?.includes(busqueda) ||
    c.cedula?.includes(busqueda) ||
    c.usuario?.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="admin-wrapper">
      <AdminNavbar titulo="Clientes" />

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
            placeholder="Buscar por nombre, usuario, teléfono o cédula..."
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
                    <span className="admin-fila-badge"
                      style={cliente.tiene_cuenta
                        ? { background: "#cfe2ff", color: "#084298" }
                        : { background: "#f0f4f1", color: "#6c757d" }}>
                      {cliente.tiene_cuenta ? "Con cuenta" : "Sin cuenta"}
                    </span>
                    {cliente.tiene_cuenta === 1 && (
                      <span className="admin-fila-badge"
                        style={cliente.twofa_activo
                          ? { background: "#d8f3dc", color: "#2d6a4f" }
                          : { background: "#fff3cd", color: "#856404" }}>
                        <i className={`bi bi-shield${cliente.twofa_activo ? "-check" : "-x"} me-1`}></i>
                        {cliente.twofa_activo ? "2FA activo" : "2FA inactivo"}
                      </span>
                    )}
                    {cliente.tiene_totp === 1 && (
                      <span className="admin-fila-badge" style={{ background: "#e8f5e9", color: "#1b5e20" }}>
                        <i className="bi bi-google me-1"></i>Google Auth
                      </span>
                    )}
                  </div>
                </div>

                <div className="admin-fila-datos">
                  {cliente.usuario && (
                    <div className="admin-fila-dato">
                      <i className="bi bi-at"></i>
                      <span>{cliente.usuario}</span>
                    </div>
                  )}
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
                  <button className="btn btn-success btn-sm"
                    onClick={() => { setClienteSeleccionado(cliente); setMostrarModal(true); }}>
                    <i className="bi bi-pencil-square me-1"></i>Editar
                  </button>

                  {cliente.tiene_cuenta === 1 && (
                    <>
                      <button
                        className={`btn btn-sm ${cliente.twofa_activo ? "btn-outline-warning" : "btn-outline-success"}`}
                        onClick={() => toggler2FA(cliente)}
                        title={cliente.twofa_activo ? "Desactivar 2FA" : "Activar 2FA"}
                      >
                        <i className={`bi bi-shield-${cliente.twofa_activo ? "x" : "check"} me-1`}></i>
                        {cliente.twofa_activo ? "Desactivar 2FA" : "Activar 2FA"}
                      </button>

                      {cliente.tiene_totp === 1 && (
                        <button className="btn btn-outline-secondary btn-sm"
                          onClick={() => resetearGoogleAuth(cliente)}
                          title="Resetear Google Authenticator">
                          <i className="bi bi-google me-1"></i>Resetear Google Auth
                        </button>
                      )}
                    </>
                  )}

                  <button className="btn btn-outline-danger btn-sm"
                    onClick={() => desactivarCliente(cliente.id)}>
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