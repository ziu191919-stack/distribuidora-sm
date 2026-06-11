import React from "react";

function FacturaModal({
  factura,
  cerrarModal
}) {

  if (!factura) return null;

  return (
    <>
      <div
        className="position-fixed top-0 start-0 w-100 h-100"
        style={{
          backgroundColor: "rgba(0,0,0,0.5)",
          zIndex: 1040
        }}
        onClick={cerrarModal}
      ></div>

      <div
        className="position-fixed top-50 start-50 translate-middle"
        style={{
          zIndex: 1050,
          width: "95%",
          maxWidth: "900px"
        }}
      >
        <div className="card shadow-lg border-0">

          <div className="card-header bg-success text-white d-flex justify-content-between align-items-center">

            <h5 className="mb-0">
              Factura #{factura.factura.id}
            </h5>

            <button
              className="btn-close btn-close-white"
              onClick={cerrarModal}
            ></button>

          </div>

          <div className="card-body">

            <div className="row mb-4">

              <div className="col-md-6">
                <strong>Cliente:</strong><br />
                {factura.factura.nombre}
              </div>

              <div className="col-md-6">
                <strong>Teléfono:</strong><br />
                {factura.factura.telefono}
              </div>

            </div>

            <div className="mb-4">

              <strong>Dirección:</strong><br />
              {factura.factura.direccion}

            </div>

            <table className="table table-bordered">

              <thead className="table-dark">

                <tr>
                  <th>Producto</th>
                  <th>Cantidad</th>
                  <th>Precio</th>
                  <th>Subtotal</th>
                </tr>

              </thead>

              <tbody>

                {factura.detalle.map((item, index) => (

                  <tr key={index}>

                    <td>{item.nombre}</td>

                    <td>{item.cantidad}</td>

                    <td>
                      ₡
                      {Number(
                        item.precio_unitario
                      ).toLocaleString()}
                    </td>

                    <td>
                      ₡
                      {Number(
                        item.subtotal
                      ).toLocaleString()}
                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

            <div className="text-end mt-4">

              <h4 className="text-success">

                Total:
                {" "}
                ₡
                {Number(
                  factura.factura.total
                ).toLocaleString()}

              </h4>

            </div>

          </div>

        </div>
      </div>
    </>
  );
}

export default FacturaModal;