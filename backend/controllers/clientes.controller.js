const conexion = require("../config/db");
const { registrarAuditoriaAdmin, ACCIONES } = require("../services/auditoria.admin.service");

// Extraer admin_id del header Authorization
const getAdminId = (req) => {
  try {
    const token = (req.headers.authorization || "").replace("Bearer ", "");
    if (!token) return null;
    const jwt = require("jsonwebtoken");
    const payload = jwt.verify(token, process.env.JWT_SECRET_ADMIN || "distribuidora_sm_admin_secret_2024");
    return payload.id || null;
  } catch { return null; }
};

const obtenerClientes = (req, res) => {
  const sql = `
    SELECT
      id,
      nombre,
      cedula,
      usuario,
      email,
      telefono,
      direccion,
      id_pais,
      id_provincia,
      id_canton,
      id_distrito,
      es_mayorista,
      activo,
      twofa_activo,
      CASE WHEN totp_secret IS NOT NULL THEN 1 ELSE 0 END AS tiene_totp,
      CASE WHEN password_hash IS NOT NULL THEN 1 ELSE 0 END AS tiene_cuenta
    FROM clientes
    WHERE activo = 1
    ORDER BY id DESC
  `;
  conexion.query(sql, (error, resultados) => {
    if (error) return res.status(500).json(error);
    const datos = resultados.map(c => ({ ...c, password_hash: c.tiene_cuenta === 1 ? "si" : null }));
    res.json(datos);
  });
};

const actualizarCliente = (req, res) => {
  const { id } = req.params;
  const {
    nombre, cedula, usuario, email, telefono, direccion, es_mayorista,
    id_pais, id_provincia, id_canton, id_distrito
  } = req.body;

  if (usuario && !/^[a-zA-Z0-9._]{3,30}$/.test(usuario))
    return res.status(400).json({ mensaje: "El usuario no cumple la política requerida" });

  const checkUsuario = (cb) => {
    if (!usuario) return cb(null);
    conexion.query("SELECT id FROM clientes WHERE usuario = ? AND id != ?", [usuario, id], (err, rows) => {
      if (err) return cb(err);
      if (rows.length > 0) return res.status(409).json({ mensaje: "Usuario no disponible" });
      cb(null);
    });
  };

  checkUsuario((err) => {
    if (err) return res.status(500).json(err);

    // Obtener es_mayorista anterior para detectar cambio
    conexion.query("SELECT es_mayorista FROM clientes WHERE id = ?", [id], (err2, rows2) => {
      if (err2) return res.status(500).json(err2);
      const mayoristaBefore = rows2[0]?.es_mayorista;

      const sql = `
        UPDATE clientes SET
          nombre=?, cedula=?, usuario=?, email=?, telefono=?, direccion=?, es_mayorista=?,
          id_pais=?, id_provincia=?, id_canton=?, id_distrito=?
        WHERE id = ?
      `;
      conexion.query(
        sql,
        [
          nombre, cedula || null, usuario || null, email || null, telefono, direccion || "", es_mayorista || 0,
          id_pais || null, id_provincia || null, id_canton || null, id_distrito || null,
          id
        ],
        (error) => {
          if (error) return res.status(500).json(error);

          const adminId = getAdminId(req);
          if (adminId) {
            registrarAuditoriaAdmin(adminId, ACCIONES.EDITAR_CLIENTE, req, `Cliente ID: ${id}`);
            // Detectar cambio de mayorista
            if (mayoristaBefore !== undefined && mayoristaBefore !== (es_mayorista || 0)) {
              const accion = (es_mayorista || 0) === 1 ? ACCIONES.ACTIVAR_MAYORISTA : ACCIONES.DESACTIVAR_MAYORISTA;
              registrarAuditoriaAdmin(adminId, accion, req, `Cliente ID: ${id}`);
            }
          }
          res.json({ mensaje: "Cliente actualizado correctamente" });
        }
      );
    });
  });
};

const desactivarCliente = (req, res) => {
  const { id } = req.params;
  conexion.query("UPDATE clientes SET activo = 0 WHERE id = ?", [id], (error) => {
    if (error) return res.status(500).json(error);
    const adminId = getAdminId(req);
    if (adminId) registrarAuditoriaAdmin(adminId, ACCIONES.DESACTIVAR_CLIENTE, req, `Cliente ID: ${id}`);
    res.json({ mensaje: "Cliente desactivado correctamente" });
  });
};

module.exports = { obtenerClientes, actualizarCliente, desactivarCliente };