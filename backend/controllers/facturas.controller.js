const conexion = require("../config/db");

const obtenerFacturas = (req, res) => {

  const sql = `
    SELECT
      p.id,
      c.nombre,
      c.telefono,
      p.total,
      p.estado,

      DATE_FORMAT(
        p.creado_en,
        '%Y-%m-%d'
      ) AS fecha

    FROM pedidos p

    INNER JOIN clientes c
      ON c.id = p.cliente_id

    WHERE p.activo = 1

    ORDER BY p.id DESC
  `;

  conexion.query(
    sql,
    (error, resultados) => {

      if (error) {
        return res.status(500).json(error);
      }

      res.json(resultados);

    }
  );

};

const obtenerFacturaPorId = (req, res) => {

  const { id } = req.params;

  const sqlFactura = `
    SELECT
      p.id,
      c.nombre,
      c.telefono,
      c.direccion,
      p.total,
      p.estado,

      DATE_FORMAT(
        p.creado_en,
        '%Y-%m-%d'
      ) AS fecha

    FROM pedidos p

    INNER JOIN clientes c
      ON c.id = p.cliente_id

    WHERE p.id = ?
  `;

  conexion.query(
    sqlFactura,
    [id],
    (errorFactura, factura) => {

      if (errorFactura) {
        return res.status(500).json(errorFactura);
      }

      if (factura.length === 0) {

        return res.status(404).json({
          mensaje: "Factura no encontrada"
        });

      }

      const sqlDetalle = `
        SELECT
          pr.nombre,
          pd.cantidad,
          pd.precio_unitario,
          pd.subtotal

        FROM pedido_detalle pd

        INNER JOIN productos pr
          ON pr.id = pd.producto_id

        WHERE pd.pedido_id = ?
      `;

      conexion.query(
        sqlDetalle,
        [id],
        (errorDetalle, detalle) => {

          if (errorDetalle) {
            return res.status(500).json(errorDetalle);
          }

          res.json({
            factura: factura[0],
            detalle
          });

        }
      );

    }
  );

};

module.exports = {
  obtenerFacturas,
  obtenerFacturaPorId
};