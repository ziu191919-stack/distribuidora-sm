// controllers/banco.controller.js
const bancoService = require("../services/banco.service");

async function postValidarTarjeta(req, res) {
  try {
    const { numero_tarjeta, fecha_vencimiento, cvv, monto } = req.body;
    if (!numero_tarjeta || !fecha_vencimiento || !cvv || !monto) {
      return res.status(400).json({ mensaje: "Faltan datos de la tarjeta" });
    }
    const resultado = await bancoService.validarTarjeta({
      numero_tarjeta, fecha_vencimiento, cvv, monto,
    });
    res.json(resultado);
  } catch (error) {
    console.error("Error validando tarjeta:", error.response?.data || error.message);
    res.status(502).json({
      error: "No se pudo conectar con el servicio del banco",
      detalle: error.response?.data || error.message,
    });
  }
}

async function postValidarSinpe(req, res) {
  try {
    const { telefono, monto } = req.body;
    if (!telefono || !monto) {
      return res.status(400).json({ mensaje: "Faltan datos de SINPE" });
    }
    const resultado = await bancoService.validarSinpe({ telefono, monto });
    res.json(resultado);
  } catch (error) {
    console.error("Error validando SINPE:", error.response?.data || error.message);
    res.status(502).json({
      error: "No se pudo conectar con el servicio del banco",
      detalle: error.response?.data || error.message,
    });
  }
}

module.exports = { postValidarTarjeta, postValidarSinpe };