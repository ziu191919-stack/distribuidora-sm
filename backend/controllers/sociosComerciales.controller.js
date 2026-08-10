// controllers/sociosComerciales.controller.js
// Maneja las peticiones entrantes y llama al servicio correspondiente,
// controlando errores si el socio comercial no responde.

const sociosService = require("../services/sociosComerciales.service");

function manejarErrorSocio(res, nombreSocio, error) {
  console.error(`Error consultando ${nombreSocio}:`, error.message);
  return res.status(502).json({
    error: `No se pudo conectar con el servicio de ${nombreSocio}`,
    detalle: error.message,
  });
}

// ---------- QuimicosCR ----------
async function getProductosQuimicos(req, res) {
  try {
    const productos = await sociosService.listarProductosQuimicos();
    res.json(productos);
  } catch (error) {
    manejarErrorSocio(res, "QuimicosCR", error);
  }
}

async function getProductoQuimicoPorLote(req, res) {
  try {
    const producto = await sociosService.consultarProductoQuimicoPorLote(
      req.params.lote
    );
    res.json(producto);
  } catch (error) {
    manejarErrorSocio(res, "QuimicosCR", error);
  }
}

// ---------- EnvasesTico ----------
async function getEnvases(req, res) {
  try {
    const envases = await sociosService.listarEnvases();
    res.json(envases);
  } catch (error) {
    manejarErrorSocio(res, "EnvasesTico", error);
  }
}

async function getEnvasePorId(req, res) {
  try {
    const envase = await sociosService.consultarEnvasePorId(req.params.id);
    res.json(envase);
  } catch (error) {
    manejarErrorSocio(res, "EnvasesTico", error);
  }
}

// ---------- AromaSupply ----------
async function getFragancias(req, res) {
  try {
    const fragancias = await sociosService.listarFragancias();
    res.json(fragancias);
  } catch (error) {
    manejarErrorSocio(res, "AromaSupply", error);
  }
}

async function getFraganciaPorId(req, res) {
  try {
    const fragancia = await sociosService.consultarFraganciaPorId(
      req.params.id
    );
    res.json(fragancia);
  } catch (error) {
    manejarErrorSocio(res, "AromaSupply", error);
  }
}

// ---------- LogiExpress ----------
async function postCotizarEnvio(req, res) {
  try {
    const { destino, peso_kg } = req.body;
    if (!destino || peso_kg === undefined) {
      return res.status(400).json({
        error: "Se requieren los campos 'destino' y 'peso_kg'",
      });
    }
    const cotizacion = await sociosService.cotizarEnvio(destino, peso_kg);
    res.json(cotizacion);
  } catch (error) {
    manejarErrorSocio(res, "LogiExpress", error);
  }
}

async function getTracking(req, res) {
  try {
    const envio = await sociosService.consultarTracking(
      req.params.numeroGuia
    );
    res.json(envio);
  } catch (error) {
    manejarErrorSocio(res, "LogiExpress", error);
  }
}

module.exports = {
  getProductosQuimicos,
  getProductoQuimicoPorLote,
  getEnvases,
  getEnvasePorId,
  getFragancias,
  getFraganciaPorId,
  postCotizarEnvio,
  getTracking,
};