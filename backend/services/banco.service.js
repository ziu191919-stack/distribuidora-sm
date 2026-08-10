// services/banco.service.js
const axios = require("axios");
const banco = require("../config/banco.config");

async function validarTarjeta({ numero_tarjeta, fecha_vencimiento, cvv, monto }) {
  const respuesta = await axios.post(
    `${banco.baseURL}/validar-tarjeta`,
    { numero_tarjeta, fecha_vencimiento, cvv, monto },
    { headers: { "X-API-Key": banco.apiKey } }
  );
  return respuesta.data;
}

async function validarSinpe({ telefono, monto }) {
  const respuesta = await axios.post(
    `${banco.baseURL}/validar-sinpe`,
    { telefono, monto },
    { headers: { "X-API-Key": banco.apiKey } }
  );
  return respuesta.data;
}

module.exports = { validarTarjeta, validarSinpe };