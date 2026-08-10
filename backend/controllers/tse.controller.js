// controllers/tse.controller.js
const tseService = require("../services/tse.service");

async function getConsultaCedula(req, res) {
  try {
    const resultado = await tseService.consultarCedula(req.params.cedula);
    res.json(resultado);
  } catch (error) {
    console.error("Error consultando TSE:", error.message);
    res.status(502).json({
      error: "No se pudo conectar con el servicio del TSE",
      detalle: error.message,
    });
  }
}

module.exports = { getConsultaCedula };