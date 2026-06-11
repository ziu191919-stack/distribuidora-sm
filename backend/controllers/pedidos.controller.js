const conexion = require("../config/db");

const obtenerPedidos = (req, res) => {
  const sql = `
    SELECT p.id, p.estado, p.total, p.es_mayorista, p.creado_en,
           c.nombre, c.email, c.telefono, mp.nombre AS metodo_pago
    FROM pedidos p
    INNER JOIN clientes c ON c.id = p.cliente_id
    INNER JOIN metodos_pago mp ON mp.id = p.metodo_pago_id
    WHERE p.activo = 1
    ORDER BY p.id DESC
  `;
  conexion.query(sql, (error, resultados) => {
    if (error) return res.status(500).json(error);
    res.json(resultados);
  });
};

const crearPedido = (req, res) => {
  const clienteId = req.clienteId;
  const { metodo_pago_id, carrito } = req.body;

  if (!carrito || carrito.length === 0)
    return res.status(400).json({ mensaje: "El carrito está vacío" });

  const totalUnidades = carrito.reduce((t, i) => t + Number(i.cantidad), 0);
  const esMayorista = totalUnidades >= 50 ? 1 : 0;

  if (esMayorista) {
    const ids = carrito.map((i) => i.id);
    const placeholders = ids.map(() => "?").join(",");
    conexion.query(
      `SELECT producto_id, precio_mayoreo FROM precios_mayorista WHERE producto_id IN (${placeholders}) AND activo = 1`,
      ids,
      (err, mayoreos) => {
        if (err) return res.status(500).json(err);
        const preciosMayoreo = {};
        mayoreos.forEach((m) => { preciosMayoreo[m.producto_id] = Number(m.precio_mayoreo); });
        const precios = {};
        carrito.forEach((i) => { precios[i.id] = preciosMayoreo[i.id] || Number(i.precio); });
        insertarPedido(clienteId, metodo_pago_id, esMayorista, carrito, precios, res);
      }
    );
  } else {
    const precios = {};
    carrito.forEach((i) => { precios[i.id] = Number(i.precio); });
    insertarPedido(clienteId, metodo_pago_id, esMayorista, carrito, precios, res);
  }
};

function insertarPedido(clienteId, metodoPagoId, esMayorista, carrito, precios, res) {
  const subtotal = carrito.reduce((t, i) => t + precios[i.id] * Number(i.cantidad), 0);

  conexion.query(
    "INSERT INTO pedidos (cliente_id, metodo_pago_id, estado, es_mayorista, subtotal, total, activo) VALUES (?,?,'pendiente',?,?,?,1)",
    [clienteId, metodoPagoId, esMayorista, subtotal, subtotal],
    (err, resultado) => {
      if (err) return res.status(500).json(err);
      const pedidoId = resultado.insertId;
      let completados = 0;

      // Detalle con precios reales aplicados
      const detalleRecibo = [];

      carrito.forEach((item) => {
        const precioFinal = precios[item.id];
        const subtotalDetalle = precioFinal * Number(item.cantidad);
        detalleRecibo.push({
          nombre: item.nombre,
          cantidad: item.cantidad,
          precio_unitario: precioFinal,
          subtotal: subtotalDetalle,
        });

        conexion.query(
          "INSERT INTO pedido_detalle (pedido_id, producto_id, cantidad, precio_unitario, subtotal) VALUES (?,?,?,?,?)",
          [pedidoId, item.id, item.cantidad, precioFinal, subtotalDetalle],
          (errD) => {
            if (errD) return res.status(500).json(errD);
            completados++;
            if (completados === carrito.length) {
              res.json({
                mensaje: "Pedido registrado correctamente",
                pedido_id: pedidoId,
                total: subtotal,
                esMayorista,
                detalle: detalleRecibo,  // precios reales para el recibo
              });
            }
          }
        );
      });
    }
  );
}

const actualizarEstadoPedido = (req, res) => {
  const { id } = req.params;
  const { estado } = req.body;

  conexion.query("SELECT estado FROM pedidos WHERE id = ?", [id], (err, pedido) => {
    if (err) return res.status(500).json(err);
    if (pedido.length === 0) return res.status(404).json({ mensaje: "Pedido no encontrado" });

    const estadoAnterior = pedido[0].estado;
    const actualizar = () => {
      conexion.query("UPDATE pedidos SET estado = ? WHERE id = ?", [estado, id], (e) => {
        if (e) return res.status(500).json(e);
        res.json({ mensaje: "Estado actualizado" });
      });
    };

    if (estado === "enviado" && estadoAnterior !== "enviado") {
      conexion.query("SELECT producto_id, cantidad FROM pedido_detalle WHERE pedido_id = ?", [id], (errD, detalles) => {
        if (errD) return res.status(500).json(errD);
        if (detalles.length === 0) return actualizar();
        let c = 0;
        detalles.forEach((d) => {
          conexion.query("UPDATE productos SET stock = stock - ? WHERE id = ?", [d.cantidad, d.producto_id], (errS) => {
            if (errS) return res.status(500).json(errS);
            c++;
            if (c === detalles.length) actualizar();
          });
        });
      });
    } else {
      actualizar();
    }
  });
};

module.exports = { obtenerPedidos, crearPedido, actualizarEstadoPedido };