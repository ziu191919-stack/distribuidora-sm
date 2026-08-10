// services/bccr.service.js
const axios = require("axios");
const bccr = require("../config/bccr.config");

const DURACION_CACHE_MS = 30 * 60 * 1000; // 30 minutos
let cache = { datos: null, guardadoEn: 0 };

function formatearFechaSDDE(fecha) {
  const yyyy = fecha.getFullYear();
  const mm = String(fecha.getMonth() + 1).padStart(2, "0");
  const dd = String(fecha.getDate()).padStart(2, "0");
  return `${yyyy}/${mm}/${dd}`;
}

/**
 * Consulta el tipo de cambio de COMPRA del dólar (indicador 317) a la
 * API SDDE del BCCR. Se consulta un rango de los ultimos 7 dias (en vez
 * de solo hoy) por si hoy es fin de semana o feriado y el BCCR no
 * publico dato ese dia; se toma el valor mas reciente disponible.
 */
async function obtenerTipoCambioCompra() {
  const ahora = Date.now();
  if (cache.datos && ahora - cache.guardadoEn < DURACION_CACHE_MS) {
    return { ...cache.datos, desdeCache: true };
  }

  const hoy = new Date();
  const hace7Dias = new Date();
  hace7Dias.setDate(hoy.getDate() - 7);

  const respuesta = await axios.get(
    `${bccr.baseURL}/indicadoresEconomicos/${bccr.indicadorTipoCambioCompra}/series`,
    {
      params: {
        fechaInicio: formatearFechaSDDE(hace7Dias),
        fechaFin: formatearFechaSDDE(hoy),
        idioma: "es",
      },
      headers: {
        Authorization: `Bearer ${bccr.token}`,
        Accept: "application/json",
      },
    }
  );

  const cuerpo = respuesta.data;
  if (!cuerpo.estado || !cuerpo.datos || cuerpo.datos.length === 0) {
    throw new Error(cuerpo.mensaje || "El BCCR no devolvió datos para este indicador.");
  }

  const serie = cuerpo.datos[0].series;
  if (!serie || serie.length === 0) {
    throw new Error("No hay valores disponibles en los últimos 7 días.");
  }

  // El ultimo elemento del arreglo es el valor mas reciente
  const ultimoDato = serie[serie.length - 1];

  const resultado = {
    indicador: bccr.indicadorTipoCambioCompra,
    tipo: cuerpo.datos[0].nombreIndicador || "Tipo de cambio de compra (dólar)",
    valor: ultimoDato.valorDatoPorPeriodo,
    fecha: ultimoDato.fecha,
    fuente: "Banco Central de Costa Rica (BCCR) - SDDE",
  };

  cache = { datos: resultado, guardadoEn: ahora };
  return { ...resultado, desdeCache: false };
}

module.exports = { obtenerTipoCambioCompra };