// config/bccr.config.js
module.exports = {
  baseURL: "https://apim.bccr.fi.cr/SDDE/api/Bccr.GE.SDDE.Publico.Indicadores.API",
  // Token generado en el sitio de Indicadores Económicos del BCCR (ahora en .env)
  token: process.env.BCCR_TOKEN,
  // 317 = Tipo de cambio de COMPRA del dólar (el que pide el profesor)
  indicadorTipoCambioCompra: 317,
};