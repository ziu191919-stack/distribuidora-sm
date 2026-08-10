const express = require("express");
const router = express.Router();
const authCliente = require("../middleware/authClientes");
const verificarCaptcha = require("../middleware/verificarCaptcha");
const {
  enviarTokenDeRegistro,
  verificarTokenRegistro,
  verificarUsuario,
  registrarCliente,
  loginCliente,
  generarOTP,
  verificarOTP,
  buscarClienteRecuperar,
  verificarRespuestaRecuperar,
  cambiarPassword,
  buscarClienteUsuario,
  revelarUsuario,
  cambiarUsuario,
  registrarAccionCliente,
  cerrarSesionCliente,
  miPerfil,
  obtenerPreguntas,
  adminDesactivar2FA,
  adminActivar2FA,
  adminResetearTOTP,
  estadoTOTP,
  generarTOTPSecret,
  confirmarTOTP,
  verificarTOTP,
} = require("../controllers/auth.clientes.controller");

// Registro
router.post("/token-registro", enviarTokenDeRegistro);
router.post("/verificar-token", verificarTokenRegistro);
router.get("/verificar-usuario/:usuario", verificarUsuario);
router.get("/preguntas", obtenerPreguntas);
router.post("/registro", registrarCliente);

// Login y 2FA
router.post("/login", verificarCaptcha, loginCliente);
router.post("/otp/generar", generarOTP);
router.post("/otp/verificar", verificarOTP);

// Recuperar contraseña
router.post("/recuperar-password/buscar", buscarClienteRecuperar);
router.post("/recuperar-password/verificar", verificarRespuestaRecuperar);
router.post("/recuperar-password/cambiar", cambiarPassword);

// Recuperar usuario
router.post("/recuperar-usuario/buscar", buscarClienteUsuario);
router.post("/recuperar-usuario/revelar", revelarUsuario);
router.post("/recuperar-usuario/cambiar", cambiarUsuario);

// Admin — gestión 2FA de clientes
router.put("/admin/2fa/desactivar/:id", adminDesactivar2FA);
router.put("/admin/2fa/activar/:id", adminActivar2FA);
router.put("/admin/totp/resetear/:id", adminResetearTOTP);

// TOTP (Google Authenticator)
router.get("/totp/estado", estadoTOTP);
router.post("/totp/generar", generarTOTPSecret);
router.post("/totp/confirmar", confirmarTOTP);
router.post("/totp/verificar", verificarTOTP);

// Cerrar sesión
router.post("/logout", cerrarSesionCliente);
router.post("/registrar-accion", registrarAccionCliente);

// Perfil
router.get("/perfil", authCliente, miPerfil);

module.exports = router;