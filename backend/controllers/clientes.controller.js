const conexion = require("../config/db");

const obtenerClientes = (req, res) => {
  const sql = `
    SELECT
      id,
      nombre,
      cedula,
      email,
      telefono,
      direccion,
      es_mayorista,
      activo,
      CASE WHEN password_hash IS NOT NULL THEN 1 ELSE 0 END AS tiene_cuenta
    FROM clientes
    WHERE activo = 1
    ORDER BY id DESC
  `;
  conexion.query(sql, (error, resultados) => {
    if (error) return res.status(500).json(error);
    // Renombrar tiene_cuenta como password_hash (booleano) para el frontend
    const datos = resultados.map(c => ({
      ...c,
      password_hash: c.tiene_cuenta === 1 ? "si" : null,
    }));
    res.json(datos);
  });
};

const actualizarCliente = (req, res) => {
  const { id } = req.params;
  const { nombre, cedula, email, telefono, direccion, es_mayorista } = req.body;

  const sql = `
    UPDATE clientes
    SET
      nombre = ?,
      cedula = ?,
      email = ?,
      telefono = ?,
      direccion = ?,
      es_mayorista = ?
    WHERE id = ?
  `;

  conexion.query(
    sql,
    [nombre, cedula || null, email || null, telefono, direccion || "", es_mayorista || 0, id],
    (error) => {
      if (error) return res.status(500).json(error);
      res.json({ mensaje: "Cliente actualizado correctamente" });
    }
  );
};

const desactivarCliente = (req, res) => {
  const { id } = req.params;
  conexion.query(
    "UPDATE clientes SET activo = 0 WHERE id = ?",
    [id],
    (error) => {
      if (error) return res.status(500).json(error);
      res.json({ mensaje: "Cliente desactivado correctamente" });
    }
  );
};

module.exports = { obtenerClientes, actualizarCliente, desactivarCliente };
