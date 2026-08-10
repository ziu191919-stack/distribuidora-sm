// services/paypal.service.js
const axios = require("axios");
const paypal = require("../config/paypal.config");

/**
 * PayPal usa OAuth2: hay que pedir un access token antes de cualquier
 * operacion. Este token expira, asi que se pide uno nuevo cada vez
 * (para un proyecto academico esto es aceptable; en producción real
 * se cachearia hasta que expire).
 */
async function obtenerAccessToken() {
  const credenciales = Buffer.from(
    `${paypal.clientId}:${paypal.clientSecret}`
  ).toString("base64");

  const respuesta = await axios.post(
    `${paypal.baseURL}/v1/oauth2/token`,
    "grant_type=client_credentials",
    {
      headers: {
        Authorization: `Basic ${credenciales}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
    }
  );

  return respuesta.data.access_token;
}

/**
 * Crea una orden de pago en PayPal (aun no cobra nada).
 * montoUSD debe venir como string, ej: "10.00"
 */
async function crearOrden(montoUSD) {
  const accessToken = await obtenerAccessToken();

  const respuesta = await axios.post(
    `${paypal.baseURL}/v2/checkout/orders`,
    {
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: {
            currency_code: "USD",
            value: montoUSD,
          },
          description: "Pedido Distribuidora S.M.",
        },
      ],
    },
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    }
  );

  return respuesta.data; // incluye el "id" de la orden, que el frontend necesita
}

/**
 * Captura (cobra) una orden que el cliente ya aprobo desde el boton de PayPal.
 */
async function capturarOrden(ordenId) {
  const accessToken = await obtenerAccessToken();

  const respuesta = await axios.post(
    `${paypal.baseURL}/v2/checkout/orders/${ordenId}/capture`,
    {},
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    }
  );

  return respuesta.data;
}

module.exports = { crearOrden, capturarOrden };