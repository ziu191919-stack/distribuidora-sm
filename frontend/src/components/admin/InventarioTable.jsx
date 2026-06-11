import EstadoStockBadge from "./EstadoStockBadge";

function InventarioTable({ productos, onEditar, onEliminar }) {
  return (
    <div className="admin-lista">
      {productos.length === 0 ? (
        <div className="admin-card text-center py-5">
          <i className="bi bi-box-seam" style={{ fontSize: "4rem", color: "#adb5bd" }}></i>
          <h4 className="mt-3">No hay productos</h4>
        </div>
      ) : (
        productos.map((producto) => (
          <div className="admin-fila" key={producto.id}>
            <div className="admin-fila-header">
              <div>
                <span className="admin-fila-id">#{producto.id}</span>
                <span className="admin-fila-nombre">{producto.nombre}</span>
              </div>
              <span className="badge bg-secondary">{producto.categoria}</span>
            </div>

            <div className="admin-fila-datos">
              <div className="admin-fila-dato">
                <i className="bi bi-boxes"></i>
                <span>Stock: <strong>{producto.stock}</strong></span>
              </div>
              <div className="admin-fila-dato">
                <i className="bi bi-exclamation-triangle"></i>
                <span>Mínimo: {producto.stock_minimo}</span>
              </div>
              <div className="admin-fila-dato">
                <i className="bi bi-tag"></i>
                <span>₡{Number(producto.precio).toLocaleString()}</span>
              </div>
              <div className="admin-fila-dato">
                <EstadoStockBadge stock={producto.stock} minimo={producto.stock_minimo} />
              </div>
            </div>

            <div className="admin-fila-acciones">
              <button
                className="btn btn-success btn-sm"
                onClick={() => onEditar(producto)}
              >
                <i className="bi bi-pencil-square me-1"></i>
                Editar
              </button>
              <button
                className="btn btn-outline-danger btn-sm"
                onClick={() => onEliminar(producto.id)}
              >
                <i className="bi bi-slash-circle me-1"></i>
                Desactivar
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

export default InventarioTable;
