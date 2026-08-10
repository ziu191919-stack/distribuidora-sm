// services/tse.service.js
const axios = require("axios");
const tse = require("../config/tse.config");

async function consultarCedula(cedula) {
  const respuesta = await axios.get(
    `${tse.baseURL}/consulta-cedula/${cedula}`,
    { headers: { "X-API-Key": tse.apiKey } }
  );
  return respuesta.data;
}

module.exports = { consultarCedula };