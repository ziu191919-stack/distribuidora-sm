import { useState, useEffect } from "react";
import InventarioTable from "../../components/admin/InventarioTable";
import ResumenInventario from "../../components/admin/ResumenInventario";
import EditarStockModal from "../../components/admin/EditarStockModal";
import "../../App.css";
import AdminNavbar from "../../components/admin/AdminNavbar";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";

function Inventario() {
  const [mostrarModal, setMostrarModal] = useState(false);
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [productos, setProductos] = useState([]);
  const [productosInactivos, setProductosInactivos] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [mostrarDesactivados, setMostrarDesactivados] = useState(false);

  useEffect(() => {
    obtenerProductos();
    obtenerProductosInactivos();
  }, []);

  const obtenerProductos = async () => {
    try {
      const r = await fetch(`${API_BASE}/productos`);
      setProductos(await r.json());
    } catch (e) { console.error(e); }
  };

  const obtenerProductosInactivos = async () => {
    try {
      const r = await fetch(`${API_BASE}/productos/inactivos`);
      setProductosInactivos(await r.json());
    } catch (e) { console.error(e); }
  };

  const guardarProducto = async (formulario, imagenFile) => {
    try {
      const formData = new FormData();
      Object.entries(formulario).forEach(([k, v]) => { if (v !== null && v !== undefined) formData.append(k, v); });
      if (imagenFile) formData.append("imagen", imagenFile);

      let r;
      if (formulario.id) {
        r = await fetch(`${API_BASE}/productos/${formulario.id}`, { method: "PUT", body: formData });
      } else {
        r = await fetch(`${API_BASE}/productos`, { method: "POST", body: formData });
      }
      const datos = await r.json();
      if (!r.ok) { alert(datos.mensaje || "Error al guardar"); return; }
      await obtenerProductos();
      await obtenerProductosInactivos();
      setMostrarModal(false);
      setProductoSeleccionado(null);
      alert(formulario.id ? "Producto actualizado" : "Producto creado");
    } catch (e) { console.error(e); }
  };

  const desactivarProducto = async (id) => {
    if (!window.confirm("¿Desea desactivar este producto?")) return;
    try {
      await fetch(`${API_BASE}/productos/desactivar/${id}`, { method: "PUT" });
      await obtenerProductos();
      await obtenerProductosInactivos();
    } catch (e) { console.error(e); }
  };

  const activarProducto = async (id) => {
    if (!window.confirm("¿Desea activar este producto?")) return;
    try {
      await fetch(`${API_BASE}/productos/activar/${id}`, { method: "PUT" });
      await obtenerProductos();
      await obtenerProductosInactivos();
    } catch (e) { console.error(e); }
  };

  const productosFiltrados = productos.filter((p) =>
    p.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="admin-wrapper">
      <AdminNavbar titulo="Inventario" />

      <div className="admin-page-header">
        <div className="container d-flex align-items-center justify-content-between flex-wrap gap-3">
          <div>
            <h1 className="admin-page-title">Control de Inventario</h1>
            <p className="admin-page-sub">{productos.length} producto{productos.length !== 1 ? "s" : ""} registrado{productos.length !== 1 ? "s" : ""}</p>
          </div>
          <button className="btn-agregar" onClick={() => { setProductoSeleccionado(null); setMostrarModal(true); }}>
            <i className="bi bi-plus-lg"></i> Agregar Producto
          </button>
        </div>
      </div>

      <div className="container pb-5">
        <ResumenInventario productos={productos} />
        <div className="search-wrapper">
          <i className="bi bi-search"></i>
          <input type="text" className="search-input" placeholder="Buscar producto por nombre..."
            value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
        </div>
        <InventarioTable
          productos={productosFiltrados}
          onEditar={(p) => { setProductoSeleccionado(p); setMostrarModal(true); }}
          onEliminar={desactivarProducto}
        />

        <div className="d-flex align-items-center justify-content-between flex-wrap gap-3 mt-5 mb-3">
          <h2 className="admin-page-title" style={{ fontSize: "1.5rem" }}>
            Productos Desactivados
          </h2>
          <button
            className="btn-agregar"
            onClick={() => setMostrarDesactivados((v) => !v)}
          >
            <i className={`bi bi-chevron-${mostrarDesactivados ? "up" : "down"}`}></i>{" "}
            {mostrarDesactivados ? "Ocultar" : "Mostrar"} ({productosInactivos.length})
          </button>
        </div>

        {mostrarDesactivados && (
          <InventarioTable
            productos={productosInactivos}
            onEditar={(p) => { setProductoSeleccionado(p); setMostrarModal(true); }}
            onActivar={activarProducto}
            modoDesactivados
          />
        )}
      </div>

      {mostrarModal && (
        <EditarStockModal
          producto={productoSeleccionado}
          cerrarModal={() => { setMostrarModal(false); setProductoSeleccionado(null); }}
          guardarProducto={guardarProducto}
        />
      )}
    </div>
  );
}

export default Inventario;