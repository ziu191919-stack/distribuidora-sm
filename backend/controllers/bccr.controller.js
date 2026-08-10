// controllers/bccr.controller.js
const bccrService = require("../services/bccr.service");

async function getTipoCambioCompra(req, res) {
  try {
    const datos = await bccrService.obtenerTipoCambioCompra();
    res.json(datos);
  } catch (error) {
    // Log detallado para diagnosticar: muestra el cuerpo real de la respuesta del BCCR
    console.error("Error consultando BCCR - status:", error.response?.status);
    console.error("Error consultando BCCR - body:", JSON.stringify(error.response?.data));
    console.error("Error consultando BCCR - mensaje:", error.message);

    res.status(502).json({
      error: "No se pudo obtener el tipo de cambio del BCCR",
      detalle: error.response?.data || error.message,
    });
  }
}

module.exports = { getTipoCambioCompra };