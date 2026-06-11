import { useState, useEffect } from "react";

function EditarStockModal({ cerrarModal, producto, guardarProducto }) {
  const esEdicion = producto !== null;
  const [categorias, setCategorias] = useState([]);

  const [nombre, setNombre] = useState(producto?.nombre || "");
  const [categoriaId, setCategoriaId] = useState(producto?.categoria_id || "");
  const [descripcion, setDescripcion] = useState(producto?.descripcion || "");
  const [precio, setPrecio] = useState(producto?.precio || "");
  const [precioMayorista, setPrecioMayorista] = useState(producto?.precio_mayorista || "");
  const [stock, setStock] = useState(producto?.stock || "");
  const [stockMinimo, setStockMinimo] = useState(producto?.stock_minimo || "");
  const [destacado, setDestacado] = useState(producto?.destacado || 0);
  const [imagenFile, setImagenFile] = useState(null);
  const [preview, setPreview] = useState(
    producto?.imagen ? `http://localhost:3000/${producto.imagen}` : null
  );

  useEffect(() => {
    fetch("http://localhost:3000/productos/categorias")
      .then((r) => r.json())
      .then(setCategorias)
      .catch(console.error);
  }, []);

  const cambiarImagen = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImagenFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const guardar = () => {
    if (!nombre.trim() || !categoriaId) {
      alert("Nombre y categoría son obligatorios");
      return;
    }
    if (!precio || Number(precio) <= 0) {
      alert("El precio debe ser mayor a 0");
      return;
    }

    const formulario = {
      id: producto?.id || null,
      nombre,
      categoria_id: categoriaId,
      descripcion,
      precio,
      precio_mayorista: precioMayorista,
      stock,
      stock_minimo: stockMinimo,
      destacado,
    };

    guardarProducto(formulario, imagenFile);
  };

  return (
    <>
      <div
        className="position-fixed top-0 start-0 w-100 h-100"
        style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1040 }}
        onClick={cerrarModal}
      />
      <div
        className="position-fixed top-50 start-50 translate-middle"
        style={{ zIndex: 1050, width: "95%", maxWidth: "820px", maxHeight: "90vh", overflowY: "auto" }}
      >
        <div className="card shadow-lg border-0">
          <div className="card-header bg-success text-white d-flex justify-content-between align-items-center">
            <h5 className="mb-0">
              <i className={`bi bi-${esEdicion ? "pencil-square" : "plus-circle"} me-2`}></i>
              {esEdicion ? "Editar Producto" : "Agregar Producto"}
            </h5>
            <button className="btn-close btn-close-white" onClick={cerrarModal} />
          </div>

          <div className="card-body">
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label fw-semibold">Nombre del producto</label>
                <input type="text" className="form-control"
                  value={nombre} onChange={(e) => setNombre(e.target.value)} />
              </div>
              <div className="col-md-6">
                <label className="form-label fw-semibold">Categoría</label>
                <select className="form-select" value={categoriaId}
                  onChange={(e) => setCategoriaId(e.target.value)}>
                  <option value="">Seleccione...</option>
                  {categorias.map((c) => (
                    <option key={c.id} value={c.id}>{c.nombre}</option>
                  ))}
                </select>
              </div>

              <div className="col-12">
                <label className="form-label fw-semibold">Descripción</label>
                <input type="text" className="form-control"
                  value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
              </div>

              <div className="col-md-4">
                <label className="form-label fw-semibold">Precio normal (₡)</label>
                <input type="number" className="form-control" min="0"
                  value={precio} onChange={(e) => setPrecio(e.target.value)} />
              </div>

              <div className="col-md-4">
                <label className="form-label fw-semibold">
                  Precio mayorista (₡)
                  <span className="text-muted fw-normal ms-1" style={{ fontSize: "0.78rem" }}>
                    — pedidos 50+ unidades
                  </span>
                </label>
                <input type="number" className="form-control" min="0"
                  placeholder="Dejar vacío si no aplica"
                  value={precioMayorista} onChange={(e) => setPrecioMayorista(e.target.value)} />
              </div>

              <div className="col-md-4">
                <label className="form-label fw-semibold">Producto destacado</label>
                <select className="form-select" value={destacado}
                  onChange={(e) => setDestacado(Number(e.target.value))}>
                  <option value={0}>No</option>
                  <option value={1}>Sí (máx. 3)</option>
                </select>
              </div>

              <div className="col-md-6">
                <label className="form-label fw-semibold">Stock actual</label>
                <input type="number" className="form-control" min="0"
                  value={stock} onChange={(e) => setStock(e.target.value)} />
              </div>

              <div className="col-md-6">
                <label className="form-label fw-semibold">Stock mínimo</label>
                <input type="number" className="form-control" min="0"
                  value={stockMinimo} onChange={(e) => setStockMinimo(e.target.value)} />
              </div>

              {/* Imagen */}
              <div className="col-12">
                <label className="form-label fw-semibold">Imagen del producto</label>
                <div className="d-flex align-items-center gap-3 flex-wrap">
                  {preview && (
                    <img
                      src={preview} alt="preview"
                      style={{
                        width: "80px", height: "80px", objectFit: "contain",
                        borderRadius: "8px", border: "1px solid #dce8e0"
                      }}
                    />
                  )}
                  <div>
                    <input type="file" className="form-control" accept="image/*"
                      onChange={cambiarImagen} />
                    <small className="text-muted">
                      PNG o JPG, máx 5MB.
                      {esEdicion ? " Dejar vacío para conservar la imagen actual." : ""}
                    </small>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="card-footer text-end">
            <button className="btn btn-secondary me-2" onClick={cerrarModal}>Cancelar</button>
            <button className="btn btn-success" onClick={guardar}>
              <i className="bi bi-check-circle-fill me-2"></i>
              {esEdicion ? "Actualizar producto" : "Guardar producto"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default EditarStockModal;
