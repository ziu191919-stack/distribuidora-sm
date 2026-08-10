// routes/banco.routes.js
const express = require("express");
const router = express.Router();
const bancoController = require("../controllers/banco.controller");

router.post("/validar-tarjeta", bancoController.postValidarTarjeta);
router.post("/validar-sinpe", bancoController.postValidarSinpe);

module.exports = router;