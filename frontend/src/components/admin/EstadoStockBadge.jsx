import React from "react";

function EstadoStockBadge({ stock, minimo }) {
  if (stock === 0) {
    return <span className="badge bg-danger">Sin Stock</span>;
  }

  if (stock <= minimo) {
    return <span className="badge bg-warning text-dark">Bajo</span>;
  }

  return <span className="badge bg-success">OK</span>;
}

export default EstadoStockBadge;