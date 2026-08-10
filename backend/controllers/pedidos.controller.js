const conexion = require("../config/db");
const { registrarAuditoriaCliente, ACCIONES_CLIENTE } = require("../services/auditoria.cliente.service");

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
  const { metodo_pago_id, carrito, direccion, id_pais, id_provincia, id_canton, id_distrito } = req.body;

  if (!carrito || carrito.length === 0)
    return res.status(400).json({ mensaje: "El carrito está vacío" });

  const ubicacion = {
    direccion: direccion || null,
    id_pais: id_pais || null,
    id_provincia: id_provincia || null,
    id_canton: id_canton || null,
    id_distrito: id_distrito || null,
  };

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
        insertarPedido(clienteId, metodo_pago_id, esMayorista, carrito, precios, res, req, ubicacion);
      }
    );
  } else {
    const precios = {};
    carrito.forEach((i) => { precios[i.id] = Number(i.precio); });
    insertarPedido(clienteId, metodo_pago_id, esMayorista, carrito, precios, res, req, ubicacion);
  }
};

function insertarPedido(clienteId, metodoPagoId, esMayorista, carrito, precios, res, req, ubicacion) {
  const subtotal = carrito.reduce((t, i) => t + precios[i.id] * Number(i.cantidad), 0);

  conexion.query(
    `INSERT INTO pedidos
       (cliente_id, metodo_pago_id, estado, es_mayorista, subtotal, total, direccion, id_pais, id_provincia, id_canton, id_distrito, activo)
     VALUES (?,?,'pendiente',?,?,?,?,?,?,?,?,1)`,
    [
      clienteId, metodoPagoId, esMayorista, subtotal, subtotal,
      ubicacion.direccion, ubicacion.id_pais, ubicacion.id_provincia, ubicacion.id_canton, ubicacion.id_distrito
    ],
    (err, resultado) => {
      if (err) return res.status(500).json(err);
      const pedidoId = resultado.insertId;
      let completados = 0;
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
              registrarAuditoriaCliente(clienteId, ACCIONES_CLIENTE.REALIZAR_PEDIDO, req, `Pedido ID: ${pedidoId} — Total: ₡${subtotal.toFixed(2)}`);
              res.json({
                mensaje: "Pedido registrado correctamente",
                pedido_id: pedidoId,
                total: subtotal,
                esMayorista,
                detalle: detalleRecibo,
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

  conexion.query("SELECT estado, stock_descontado, cliente_id FROM pedidos WHERE id = ?", [id], (err, pedido) => {
    if (err) return res.status(500).json(err);
    if (pedido.length === 0) return res.status(404).json({ mensaje: "Pedido no encontrado" });

    const estadoAnterior = pedido[0].estado;
    const stockDescontado = pedido[0].stock_descontado;
    const clienteId = pedido[0].cliente_id;

    if (
      estado === "pendiente" &&
      ["enviado", "en_entrega", "anulado"].includes(estadoAnterior)
    ) {
      return res.status(400).json({
        mensaje: "No se puede regresar a pendiente un pedido que ya fue enviado, está en entrega o fue anulado",
      });
    }

    const actualizar = (marcarStockDescontado = false) => {
      const sql = marcarStockDescontado
        ? "UPDATE pedidos SET estado = ?, stock_descontado = 1 WHERE id = ?"
        : "UPDATE pedidos SET estado = ? WHERE id = ?";
      conexion.query(sql, [estado, id], (e) => {
        if (e) return res.status(500).json(e);
        // Registrar si el cliente anuló su pedido
        if (estado === "anulado") {
          registrarAuditoriaCliente(clienteId, ACCIONES_CLIENTE.CANCELAR_PEDIDO, req, `Pedido ID: ${id}`);
        }
        res.json({ mensaje: "Estado actualizado" });
      });
    };

    if (estado === "enviado" && estadoAnterior !== "enviado" && !stockDescontado) {
      conexion.query("SELECT producto_id, cantidad FROM pedido_detalle WHERE pedido_id = ?", [id], (errD, detalles) => {
        if (errD) return res.status(500).json(errD);
        if (detalles.length === 0) return actualizar(true);
        let c = 0;
        detalles.forEach((d) => {
          conexion.query("UPDATE productos SET stock = stock - ? WHERE id = ?", [d.cantidad, d.producto_id], (errS) => {
            if (errS) return res.status(500).json(errS);
            c++;
            if (c === detalles.length) actualizar(true);
          });
        });
      });
    } else {
      actualizar();
    }
  });
};

module.exports = { obtenerPedidos, crearPedido, actualizarEstadoPedido };