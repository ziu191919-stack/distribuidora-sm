import { useState, useEffect } from "react";
import InventarioTable from "../../components/admin/InventarioTable";
import ResumenInventario from "../../components/admin/ResumenInventario";
import EditarStockModal from "../../components/admin/EditarStockModal";
import "../../App.css";

function Inventario() {
  const [mostrarModal, setMostrarModal] = useState(false);
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [productos, setProductos] = useState([]);
  const [busqueda, setBusqueda] = useState("");

  useEffect(() => { obtenerProductos(); }, []);

  const obtenerProductos = async () => {
    try {
      const r = await fetch("http://localhost:3000/productos");
      setProductos(await r.json());
    } catch (e) { console.error(e); }
  };

  const guardarProducto = async (formulario, imagenFile) => {
    try {
      const formData = new FormData();
      Object.entries(formulario).forEach(([k, v]) => { if (v !== null && v !== undefined) formData.append(k, v); });
      if (imagenFile) formData.append("imagen", imagenFile);

      let r;
      if (formulario.id) {
        r = await fetch(`http://localhost:3000/productos/${formulario.id}`, { method: "PUT", body: formData });
      } else {
        r = await fetch("http://localhost:3000/productos", { method: "POST", body: formData });
      }
      const datos = await r.json();
      if (!r.ok) { alert(datos.mensaje || "Error al guardar"); return; }
      await obtenerProductos();
      setMostrarModal(false);
      setProductoSeleccionado(null);
      alert(formulario.id ? "Producto actualizado" : "Producto creado");
    } catch (e) { console.error(e); }
  };

  const desactivarProducto = async (id) => {
    if (!window.confirm("¿Desea desactivar este producto?")) return;
    try {
      await fetch(`http://localhost:3000/productos/desactivar/${id}`, { method: "PUT" });
      await obtenerProductos();
    } catch (e) { console.error(e); }
  };

  const productosFiltrados = productos.filter((p) =>
    p.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="admin-wrapper">
      <nav className="admin-navbar">
        <div className="container">
          <div style={{ display: "flex", alignItems: "center" }}>
            <a href="/admin" className="admin-brand">
              <span className="admin-brand-dot"></span>Distribuidora S.M
            </a>
            <span className="admin-badge-panel">Inventario</span>
          </div>
          <a href="/admin" className="btn-dashboard">
            <i className="bi bi-speedometer2"></i> Dashboard
          </a>
        </div>
      </nav>

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
