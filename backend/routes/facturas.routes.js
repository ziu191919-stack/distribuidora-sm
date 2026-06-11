const express = require("express");

const router = express.Router();

const {
  obtenerFacturas,
  obtenerFacturaPorId
} = require(
  "../controllers/facturas.controller"
);

router.get(
  "/",
  obtenerFacturas
);

router.get(
  "/:id",
  obtenerFacturaPorId
);

module.exports = router;