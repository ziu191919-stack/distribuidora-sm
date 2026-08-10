// controllers/paypal.controller.js
const paypalService = require("../services/paypal.service");

async function postCrearOrden(req, res) {
  try {
    const { monto } = req.body;
    if (!monto) {
      return res.status(400).json({ mensaje: "Se requiere el campo 'monto'" });
    }
    const orden = await paypalService.crearOrden(monto);
    res.json(orden);
  } catch (error) {
    console.error("Error creando orden PayPal:", error.response?.data || error.message);
    res.status(502).json({
      error: "No se pudo crear la orden de PayPal",
      detalle: error.response?.data || error.message,
    });
  }
}

async function postCapturarOrden(req, res) {
  try {
    const { ordenId } = req.params;
    const resultado = await paypalService.capturarOrden(ordenId);
    res.json(resultado);
  } catch (error) {
    console.error("Error capturando orden PayPal:", error.response?.data || error.message);
    res.status(502).json({
      error: "No se pudo capturar la orden de PayPal",
      detalle: error.response?.data || error.message,
    });
  }
}

module.exports = { postCrearOrden, postCapturarOrden };