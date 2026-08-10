const conexion = require("../config/db");

// IDs de acciones_admin
const ACCIONES = {
  LOGIN_CORRECTO:          1,
  LOGIN_INCORRECTO:        2,
  CERRAR_SESION:           3,
  AGREGAR_PRODUCTO:        4,
  EDITAR_PRODUCTO:         5,
  ELIMINAR_PRODUCTO:       6,
  MODIFICAR_STOCK:         7,
  AGREGAR_CLIENTE:         8,
  EDITAR_CLIENTE:          9,
  DESACTIVAR_CLIENTE:      10,
  ACTIVAR_2FA_CLIENTE:     11,
  DESACTIVAR_2FA_CLIENTE:  12,
  RESETEAR_GOOGLE_AUTH:    13,
  ACTIVAR_MAYORISTA:       14,
  DESACTIVAR_MAYORISTA:    15,
  VER_RESUMEN:             16,
  VER_FACTURAS:            17,
  VER_PEDIDOS:             18,
  CAMBIAR_ESTADO_PEDIDO:   19,
};

const registrarAuditoriaAdmin = (admin_id, accion_id, req, detalle = null) => {
  const ua = req.headers["user-agent"] || "";
  const ip = req.headers["x-forwarded-for"] || req.connection?.remoteAddress || "";
  const ahora = new Date();
  const fecha = ahora.toISOString().slice(0, 10);
  const hora  = ahora.toTimeString().slice(0, 8);

  let so = "Desconocido";
  if (/windows/i.test(ua))        so = "Windows";
  else if (/android/i.test(ua))   so = "Android";
  else if (/iphone|ipad/i.test(ua)) so = "iOS";
  else if (/mac/i.test(ua))       so = "macOS";
  else if (/linux/i.test(ua))     so = "Linux";

  let dispositivo = "Escritorio";
  if (/mobile|android|iphone/i.test(ua)) dispositivo = "Móvil";
  else if (/tablet|ipad/i.test(ua))      dispositivo = "Tablet";

  conexion.query(
    `INSERT INTO auditoria_admin 
     (admin_id, accion_id, detalle, ip, navegador, sistema_operativo, dispositivo, fecha, hora)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [admin_id, accion_id, detalle, ip.slice(0, 45), ua.slice(0, 255), so, dispositivo, fecha, hora],
    (err) => { if (err) console.error("Error auditoría admin:", err); }
  );
};

module.exports = { registrarAuditoriaAdmin, ACCIONES };