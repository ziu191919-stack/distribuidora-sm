const express = require("express");
const router = express.Router();
const { obtenerPedidos, crearPedido, actualizarEstadoPedido } = require("../controllers/pedidos.controller");
const authCliente = require("../middleware/authClientes");

router.get("/", obtenerPedidos);
router.post("/", authCliente, crearPedido);    // requiere login
router.put("/estado/:id", actualizarEstadoPedido);

module.exports = router;
