// config/paypal.config.js
module.exports = {
  clientId: process.env.PAYPAL_CLIENT_ID,
  clientSecret: process.env.PAYPAL_CLIENT_SECRET,
  // Sandbox = pruebas con dinero ficticio. Para producción sería api-m.paypal.com
  baseURL: "https://api-m.sandbox.paypal.com",
};