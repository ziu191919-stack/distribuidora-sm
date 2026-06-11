const express = require("express");
const router = express.Router();
const { registrarCliente, loginCliente, miPerfil, olvidePasword, resetPassword } = require("../controllers/auth.clientes.controller");
const authCliente = require("../middleware/authClientes");

router.post("/registro", registrarCliente);
router.post("/login", loginCliente);
router.get("/perfil", authCliente, miPerfil);
router.post("/olvide-password", olvidePasword);
router.post("/reset-password", resetPassword);

module.exports = router;
