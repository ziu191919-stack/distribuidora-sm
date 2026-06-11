const conexion = require("../config/db");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const { enviarEmailResetPassword } = require("../services/email.service");

const JWT_SECRET = process.env.JWT_SECRET_CLIENTES || "distribuidora_sm_clientes_secret_2024";

// REGISTRO
const registrarCliente = (req, res) => {
  const { nombre, cedula, email, telefono, direccion, password } = req.body;

  if (!nombre || !cedula || !email || !telefono || !password)
    return res.status(400).json({ mensaje: "Todos los campos son requeridos" });

  if (!/^\d{9,12}$/.test(cedula))
    return res.status(400).json({ mensaje: "La cédula debe tener entre 9 y 12 números" });

  if (!/^\d{8}$/.test(telefono))
    return res.status(400).json({ mensaje: "El teléfono debe tener 8 dígitos" });

  const REGEX_PASSWORD = /^(?=.*[0-9])(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
  if (!REGEX_PASSWORD.test(password))
    return res.status(400).json({ mensaje: "La contraseña debe tener al menos 8 caracteres, 1 número y 1 carácter especial" });

  conexion.query("SELECT id FROM clientes WHERE cedula = ?", [cedula], (err, rows) => {
    if (err) return res.status(500).json(err);
    if (rows.length > 0) return res.status(409).json({ mensaje: "Ya existe una cuenta con esa cédula" });

    const hash = bcrypt.hashSync(password, 10);
    const sql = "INSERT INTO clientes (nombre, cedula, email, telefono, direccion, password_hash, activo) VALUES (?,?,?,?,?,?,1)";
    conexion.query(sql, [nombre, cedula, email, telefono, direccion || "", hash], (err2, resultado) => {
      if (err2) return res.status(500).json(err2);
      const token = jwt.sign({ id: resultado.insertId, cedula, nombre }, JWT_SECRET, { expiresIn: "7d" });
      res.status(201).json({
        mensaje: "Cuenta creada correctamente",
        token,
        cliente: { id: resultado.insertId, nombre, cedula, telefono, direccion: direccion || "" }
      });
    });
  });
};

// LOGIN
const loginCliente = (req, res) => {
  const { cedula, password } = req.body;
  if (!cedula || !password) return res.status(400).json({ mensaje: "Cédula y contraseña requeridas" });

  conexion.query(
    "SELECT id, nombre, cedula, email, telefono, direccion, password_hash FROM clientes WHERE cedula = ? AND activo = 1",
    [cedula],
    (err, rows) => {
      if (err) return res.status(500).json(err);
      if (rows.length === 0) return res.status(401).json({ mensaje: "Cédula o contraseña incorrectos" });

      const cliente = rows[0];
      if (!cliente.password_hash) return res.status(401).json({ mensaje: "Esta cuenta no tiene contraseña configurada" });

      if (!bcrypt.compareSync(password, cliente.password_hash))
        return res.status(401).json({ mensaje: "Cédula o contraseña incorrectos" });

      const token = jwt.sign({ id: cliente.id, cedula: cliente.cedula, nombre: cliente.nombre }, JWT_SECRET, { expiresIn: "7d" });
      res.json({
        mensaje: "Login exitoso",
        token,
        cliente: { id: cliente.id, nombre: cliente.nombre, cedula: cliente.cedula, email: cliente.email, telefono: cliente.telefono, direccion: cliente.direccion }
      });
    }
  );
};

// PERFIL
const miPerfil = (req, res) => {
  conexion.query(
    "SELECT id, nombre, cedula, email, telefono, direccion FROM clientes WHERE id = ? AND activo = 1",
    [req.clienteId],
    (err, rows) => {
      if (err) return res.status(500).json(err);
      if (rows.length === 0) return res.status(404).json({ mensaje: "Cliente no encontrado" });
      res.json(rows[0]);
    }
  );
};

// OLVIDE PASSWORD
const olvidePasword = (req, res) => {
  const { cedula, email } = req.body;
  if (!cedula || !email) return res.status(400).json({ mensaje: "Cédula y email requeridos" });

  conexion.query(
    "SELECT id, nombre, email FROM clientes WHERE cedula = ? AND email = ? AND activo = 1",
    [cedula, email],
    async (err, rows) => {
      if (err) return res.status(500).json(err);
      // Por seguridad siempre responder igual aunque no exista
      if (rows.length === 0) return res.json({ mensaje: "Si los datos coinciden recibirás un correo" });

      const cliente = rows[0];
      const token = crypto.randomBytes(32).toString("hex");
      const expira = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

      // Guardar token en DB
      conexion.query(
        "INSERT INTO password_reset_tokens (cliente_id, token, expira_en) VALUES (?,?,?) ON DUPLICATE KEY UPDATE token=?, expira_en=?",
        [cliente.id, token, expira, token, expira],
        async (err2) => {
          if (err2) return res.status(500).json(err2);
          await enviarEmailResetPassword({ nombre: cliente.nombre, email: cliente.email, token });
          res.json({ mensaje: "Si los datos coinciden recibirás un correo" });
        }
      );
    }
  );
};

// RESET PASSWORD
const resetPassword = (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) return res.status(400).json({ mensaje: "Token y contraseña requeridos" });

  const REGEX_PASSWORD = /^(?=.*[0-9])(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
  if (!REGEX_PASSWORD.test(password))
    return res.status(400).json({ mensaje: "La contraseña no cumple los requisitos de seguridad" });

  conexion.query(
    "SELECT cliente_id, expira_en FROM password_reset_tokens WHERE token = ?",
    [token],
    (err, rows) => {
      if (err) return res.status(500).json(err);
      if (rows.length === 0) return res.status(400).json({ mensaje: "Token inválido o ya utilizado" });

      const { cliente_id, expira_en } = rows[0];
      if (new Date() > new Date(expira_en))
        return res.status(400).json({ mensaje: "El enlace expiró. Solicita uno nuevo" });

      const hash = bcrypt.hashSync(password, 10);
      conexion.query("UPDATE clientes SET password_hash = ? WHERE id = ?", [hash, cliente_id], (err2) => {
        if (err2) return res.status(500).json(err2);
        conexion.query("DELETE FROM password_reset_tokens WHERE token = ?", [token]);
        res.json({ mensaje: "Contraseña actualizada correctamente" });
      });
    }
  );
};

module.exports = { registrarCliente, loginCliente, miPerfil, olvidePasword, resetPassword };
