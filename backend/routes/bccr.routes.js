// routes/bccr.routes.js
const express = require("express");
const router = express.Router();
const bccrController = require("../controllers/bccr.controller");

router.get("/tipo-cambio-compra", bccrController.getTipoCambioCompra);

module.exports = router;