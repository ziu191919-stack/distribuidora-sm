// routes/paypal.routes.js
const express = require("express");
const router = express.Router();
const paypalController = require("../controllers/paypal.controller");

router.post("/crear-orden", paypalController.postCrearOrden);
router.post("/capturar-orden/:ordenId", paypalController.postCapturarOrden);

module.exports = router;