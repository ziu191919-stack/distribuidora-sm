// services/sociosComerciales.service.js
// Funciones que consumen las 4 APIs externas de socios comerciales (Python/FastAPI)

const axios = require("axios");
const socios = require("../config/sociosComerciales.config");

// ---------- QuimicosCR ----------
async function listarProductosQuimicos() {
  const respuesta = await axios.get(`${socios.quimicosCR.baseURL}/productos`, {
    headers: { "X-API-Key": socios.quimicosCR.apiKey },
  });
  return respuesta.data;
}

async function consultarProductoQuimicoPorLote(lote) {
  const respuesta = await axios.get(
    `${socios.quimicosCR.baseURL}/productos/${lote}`,
    { headers: { "X-API-Key": socios.quimicosCR.apiKey } }
  );
  return respuesta.data;
}

// ---------- EnvasesTico ----------
async function listarEnvases() {
  const respuesta = await axios.get(`${socios.envasesTico.baseURL}/envases`, {
    headers: { "X-API-Key": socios.envasesTico.apiKey },
  });
  return respuesta.data;
}

async function consultarEnvasePorId(id) {
  const respuesta = await axios.get(
    `${socios.envasesTico.baseURL}/envases/${id}`,
    { headers: { "X-API-Key": socios.envasesTico.apiKey } }
  );
  return respuesta.data;
}

// ---------- AromaSupply ----------
async function listarFragancias() {
  const respuesta = await axios.get(`${socios.aromaSupply.baseURL}/fragancias`, {
    headers: { "X-API-Key": socios.aromaSupply.apiKey },
  });
  return respuesta.data;
}

async function consultarFraganciaPorId(id) {
  const respuesta = await axios.get(
    `${socios.aromaSupply.baseURL}/fragancias/${id}`,
    { headers: { "X-API-Key": socios.aromaSupply.apiKey } }
  );
  return respuesta.data;
}

// ---------- LogiExpress ----------
async function cotizarEnvio(destino, pesoKg) {
  const respuesta = await axios.post(
    `${socios.logiExpress.baseURL}/cotizar`,
    { destino, peso_kg: pesoKg },
    { headers: { "X-API-Key": socios.logiExpress.apiKey } }
  );
  return respuesta.data;
}

async function consultarTracking(numeroGuia) {
  const respuesta = await axios.get(
    `${socios.logiExpress.baseURL}/tracking/${numeroGuia}`,
    { headers: { "X-API-Key": socios.logiExpress.apiKey } }
  );
  return respuesta.data;
}

module.exports = {
  listarProductosQuimicos,
  consultarProductoQuimicoPorLote,
  listarEnvases,
  consultarEnvasePorId,
  listarFragancias,
  consultarFraganciaPorId,
  cotizarEnvio,
  consultarTracking,
};