// routes/sociosComerciales.routes.js
const express = require("express");
const router = express.Router();
const sociosController = require("../controllers/sociosComerciales.controller");

// QuimicosCR
router.get("/quimicos", sociosController.getProductosQuimicos);
router.get("/quimicos/:lote", sociosController.getProductoQuimicoPorLote);

// EnvasesTico
router.get("/envases", sociosController.getEnvases);
router.get("/envases/:id", sociosController.getEnvasePorId);

// AromaSupply
router.get("/fragancias", sociosController.getFragancias);
router.get("/fragancias/:id", sociosController.getFraganciaPorId);

// LogiExpress
router.post("/envios/cotizar", sociosController.postCotizarEnvio);
router.get("/envios/tracking/:numeroGuia", sociosController.getTracking);

module.exports = router;