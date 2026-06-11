const conexion = require("../config/db");

const obtenerResumen = (req, res) => {

  const { mes, anio } = req.query;

  let filtroFecha = "";

  if (mes && anio) {

    filtroFecha = `
      AND MONTH(creado_en) = ${Number(mes)}
      AND YEAR(creado_en) = ${Number(anio)}
    `;

  }

  const resumen = {};

  const sqlVentas = `
    SELECT
      IFNULL(SUM(total),0) AS total_ventas,
      COUNT(*) AS total_pedidos
    FROM pedidos
    WHERE activo = 1
    ${filtroFecha}
  `;

  conexion.query(
    sqlVentas,
    (errorVentas, ventas) => {

      if (errorVentas) {
        return res.status(500).json(errorVentas);
      }

      resumen.total_ventas =
        ventas[0].total_ventas;

      resumen.total_pedidos =
        ventas[0].total_pedidos;

      const sqlClientes = `
        SELECT
          COUNT(*) AS total_clientes,
          SUM(
            CASE
              WHEN es_mayorista = 1
              THEN 1
              ELSE 0
            END
          ) AS total_mayoristas
        FROM clientes
        WHERE activo = 1
      `;

      conexion.query(
        sqlClientes,
        (errorClientes, clientes) => {

          if (errorClientes) {
            return res.status(500).json(errorClientes);
          }

          resumen.total_clientes =
            clientes[0].total_clientes;

          resumen.total_mayoristas =
            clientes[0].total_mayoristas || 0;

          const sqlProductoMasVendido = `
            SELECT
              p.nombre,
              SUM(pd.cantidad) AS total_vendido
            FROM pedido_detalle pd
            INNER JOIN pedidos pe
              ON pe.id = pd.pedido_id
            INNER JOIN productos p
              ON p.id = pd.producto_id
            WHERE pe.activo = 1
            ${
              filtroFecha
                ? filtroFecha.replace(
                    /creado_en/g,
                    "pe.creado_en"
                  )
                : ""
            }
            GROUP BY pd.producto_id
            ORDER BY total_vendido DESC
            LIMIT 1
          `;

          conexion.query(
            sqlProductoMasVendido,
            (
              errorProducto,
              producto
            ) => {

              if (errorProducto) {
                return res.status(500).json(errorProducto);
              }

              resumen.producto_mas_vendido =
                producto.length > 0
                  ? producto[0]
                  : null;

              const sqlClienteTop = `
                SELECT
                  c.nombre,
                  COUNT(*) AS total_pedidos
                FROM pedidos p
                INNER JOIN clientes c
                  ON c.id = p.cliente_id
                WHERE p.activo = 1
                ${
                  filtroFecha
                    ? filtroFecha.replace(
                        /creado_en/g,
                        "p.creado_en"
                      )
                    : ""
                }
                GROUP BY p.cliente_id
                ORDER BY total_pedidos DESC
                LIMIT 1
              `;

              conexion.query(
                sqlClienteTop,
                (
                  errorClienteTop,
                  clienteTop
                ) => {

                  if (errorClienteTop) {
                    return res.status(500).json(errorClienteTop);
                  }

                  resumen.cliente_top =
                    clienteTop.length > 0
                      ? clienteTop[0]
                      : null;

                  res.json(resumen);

                }
              );

            }
          );

        }
      );

    }
  );

};

module.exports = {
  obtenerResumen
};