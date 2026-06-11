const express = require("express");

const router = express.Router();

const {
  obtenerClientes,
  actualizarCliente,
  desactivarCliente
} = require(
  "../controllers/clientes.controller"
);

router.get(
  "/",
  obtenerClientes
);

router.put(
  "/:id",
  actualizarCliente
);

router.put(
  "/desactivar/:id",
  desactivarCliente
);

module.exports = router;