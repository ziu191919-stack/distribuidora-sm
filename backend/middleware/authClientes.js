const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET_CLIENTES || "distribuidora_sm_clientes_secret_2024";

const authCliente = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ mensaje: "Token requerido" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.clienteId = payload.id;
    req.clienteCedula = payload.cedula;
    req.clienteNombre = payload.nombre;
    next();
  } catch (error) {
    return res.status(401).json({ mensaje: "Token inválido o expirado" });
  }
};

module.exports = authCliente;
