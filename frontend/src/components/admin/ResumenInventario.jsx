function ResumenInventario({ productos }) {

  const stockBajo = productos.filter(
    p => p.stock > 0 && p.stock <= p.stock_minimo
  ).length;

  const sinStock = productos.filter(
    p => p.stock === 0
  ).length;

  return (
    <div className="row mb-4">

      {/* Productos */}
      <div className="col-md-4 mb-3">
        <div className="card border-0 shadow-sm h-100">
          <div className="card-body text-center">

            <i className="bi bi-box-seam-fill text-success display-4"></i>

            <h6 className="mt-3 text-muted">
              Productos
            </h6>

            <h2 className="fw-bold">
              {productos.length}
            </h2>

          </div>
        </div>
      </div>

      {/* Stock Bajo */}
      <div className="col-md-4 mb-3">
        <div className="card border-0 shadow-sm h-100">
          <div className="card-body text-center">

            <i className="bi bi-exclamation-triangle-fill text-warning display-4"></i>

            <h6 className="mt-3 text-muted">
              Stock Bajo
            </h6>

            <h2 className="fw-bold">
              {stockBajo}
            </h2>

          </div>
        </div>
      </div>

      {/* Agotados */}
      <div className="col-md-4 mb-3">
        <div className="card border-0 shadow-sm h-100">
          <div className="card-body text-center">

            <i className="bi bi-x-circle-fill text-danger display-4"></i>

            <h6 className="mt-3 text-muted">
              Agotados
            </h6>

            <h2 className="fw-bold">
              {sinStock}
            </h2>

          </div>
        </div>
      </div>

    </div>
  );
}

export default ResumenInventario;