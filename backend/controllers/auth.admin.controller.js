const conexion = require("../config/db");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { registrarAuditoriaAdmin, ACCIONES } = require("../services/auditoria.admin.service");

const JWT_SECRET_ADMIN = process.env.JWT_SECRET_ADMIN || "distribuidora_sm_admin_secret_2024";

const loginAdmin = (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ mensaje: "Correo y contraseña requeridos" });

  conexion.query(
    "SELECT id, nombre, email, password_hash FROM administradores WHERE email = ? AND activo = 1",
    [email],
    (err, rows) => {
      if (err) return res.status(500).json(err);
      if (rows.length === 0) {
        // No revelar si el correo existe
        return res.status(401).json({ mensaje: "Credenciales incorrectas" });
      }

      const admin = rows[0];
      if (!bcrypt.compareSync(password, admin.password_hash)) {
        registrarAuditoriaAdmin(admin.id, ACCIONES.LOGIN_INCORRECTO, req);
        return res.status(401).json({ mensaje: "Credenciales incorrectas" });
      }

      registrarAuditoriaAdmin(admin.id, ACCIONES.LOGIN_CORRECTO, req);

      const token = jwt.sign(
        { id: admin.id, email: admin.email, nombre: admin.nombre, rol: "admin" },
        JWT_SECRET_ADMIN,
        { expiresIn: "8h" }
      );
      res.json({
        mensaje: "Login exitoso",
        token,
        admin: { id: admin.id, nombre: admin.nombre, email: admin.email }
      });
    }
  );
};

const logoutAdmin = (req, res) => {
  const { admin_id } = req.body;
  if (admin_id) registrarAuditoriaAdmin(admin_id, ACCIONES.CERRAR_SESION, req);
  res.json({ mensaje: "Sesión cerrada" });
};

module.exports = { loginAdmin, logoutAdmin };