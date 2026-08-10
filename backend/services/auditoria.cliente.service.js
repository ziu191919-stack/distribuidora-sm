const conexion = require("../config/db");

// IDs de acciones_cliente
const ACCIONES_CLIENTE = {
  LOGIN_CORRECTO:           1,
  LOGIN_INCORRECTO:         2,
  CUENTA_BLOQUEADA:         3,
  LOGIN_CUENTA_BLOQUEADA:   4,
  OTP_CORRECTO:             5,
  OTP_INCORRECTO:           6,
  CAMBIO_PASSWORD:          7,
  CAMBIO_USUARIO:           8,
  RECUPERACION_PASSWORD:    9,
  RECUPERACION_USUARIO:     10,
  PREGUNTA_INCORRECTA:      11,
  ACTIVAR_2FA:              12,
  DESACTIVAR_2FA:           13,
  REGISTRO_CUENTA:          14,
  VERIFICACION_TOKEN:       15,
  TOKEN_EXPIRADO:           16,
  CONFIGURAR_GOOGLE_AUTH:   17,
  CIERRE_SESION:            18,
  REALIZAR_PEDIDO:          19,
  CANCELAR_PEDIDO:          20,
  VER_HISTORIAL_PEDIDOS:    21,
  AGREGAR_AL_CARRITO:       22,
  VACIAR_CARRITO:           23,
  VER_DETALLE_PRODUCTO:     24,
  VER_CATALOGO:             25,
  FILTRAR_CATEGORIA:        26,
  VER_FACTURA:              27,
  ACTUALIZAR_CARRITO:       28,
};

const registrarAuditoriaCliente = (cliente_id, accion_id, req, detalle = null) => {
  const ua = req.headers["user-agent"] || "";
  const ip = req.headers["x-forwarded-for"] || req.connection?.remoteAddress || "";
  const ahora = new Date();
  const fecha = ahora.toISOString().slice(0, 10);
  const hora  = ahora.toTimeString().slice(0, 8);

  let so = "Desconocido";
  if (/windows/i.test(ua))          so = "Windows";
  else if (/android/i.test(ua))     so = "Android";
  else if (/iphone|ipad/i.test(ua)) so = "iOS";
  else if (/mac/i.test(ua))         so = "macOS";
  else if (/linux/i.test(ua))       so = "Linux";

  let dispositivo = "Escritorio";
  if (/mobile|android|iphone/i.test(ua)) dispositivo = "Móvil";
  else if (/tablet|ipad/i.test(ua))      dispositivo = "Tablet";

  conexion.query(
    `INSERT INTO auditoria_cliente
     (cliente_id, accion_id, detalle, ip, navegador, sistema_operativo, dispositivo, fecha, hora)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [cliente_id || null, accion_id, detalle, ip.slice(0, 45), ua.slice(0, 255), so, dispositivo, fecha, hora],
    (err) => { if (err) console.error("Error auditoría cliente:", err); }
  );
};

module.exports = { registrarAuditoriaCliente, ACCIONES_CLIENTE };