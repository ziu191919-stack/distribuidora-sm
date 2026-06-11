const express = require("express");

const router = express.Router();

const {
  obtenerResumen
} = require(
  "../controllers/resumen.controller"
);

router.get(
  "/",
  obtenerResumen
);

module.exports = router;