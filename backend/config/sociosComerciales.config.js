// config/sociosComerciales.config.js
// Configuracion centralizada de los 4 socios comerciales (APIs externas simuladas en Python/FastAPI)

module.exports = {
  quimicosCR: {
    baseURL: "http://localhost:8001",
    apiKey: "quimicoscr-2026-secret",
  },
  envasesTico: {
    baseURL: "http://localhost:8002",
    apiKey: "envastico-2026-secret",
  },
  aromaSupply: {
    baseURL: "http://localhost:8003",
    apiKey: "aromasupply-2026-secret",
  },
  logiExpress: {
    baseURL: "http://localhost:8004",
    apiKey: "logiexpress-2026-secret",
  },
};