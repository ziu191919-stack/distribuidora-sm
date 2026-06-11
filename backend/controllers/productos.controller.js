const conexion = require("../config/db");
const path = require("path");
const fs = require("fs");

const sqlBase = `
  SELECT p.id, p.categoria_id, p.nombre, p.descripcion, p.precio,
         p.stock, p.stock_minimo, p.destacado,
         c.nombre AS categoria,
         pi.url AS imagen,
         pm.precio_mayoreo AS precio_mayorista
  FROM productos p
  INNER JOIN categorias c ON c.id = p.categoria_id
  LEFT JOIN producto_imagenes pi ON pi.producto_id = p.id AND pi.es_principal = 1 AND pi.activo = 1
  LEFT JOIN precios_mayorista pm ON pm.producto_id = p.id AND pm.activo = 1
  WHERE p.activo = 1
`;

const obtenerProductos = (req, res) => {
  conexion.query(sqlBase + " ORDER BY p.id DESC", (err, rows) => {
    if (err) return res.status(500).json(err);
    res.json(rows);
  });
};

const obtenerProductosDestacados = (req, res) => {
  conexion.query(sqlBase + " AND p.destacado = 1 ORDER BY p.id DESC", (err, rows) => {
    if (err) return res.status(500).json(err);
    res.json(rows);
  });
};

const obtenerProductoPorId = (req, res) => {
  conexion.query(sqlBase + " AND p.id = ?", [req.params.id], (err, rows) => {
    if (err) return res.status(500).json(err);
    if (rows.length === 0) return res.status(404).json({ mensaje: "Producto no encontrado" });
    res.json(rows[0]);
  });
};

const obtenerCategorias = (req, res) => {
  conexion.query("SELECT * FROM categorias WHERE id <> 1 ORDER BY nombre", (err, rows) => {
    if (err) return res.status(500).json(err);
    res.json(rows);
  });
};

const crearProducto = (req, res) => {
  const { categoria_id, nombre, descripcion, precio, precio_mayorista, stock, stock_minimo, destacado } = req.body;
  const imagenFile = req.file;

  if (Number(destacado) === 1) {
    conexion.query("SELECT COUNT(*) AS total FROM productos WHERE destacado = 1 AND activo = 1", (err, r) => {
      if (err) return res.status(500).json(err);
      if (r[0].total >= 3) return res.status(400).json({ mensaje: "Solo se permiten 3 productos destacados" });
      insertar();
    });
  } else {
    insertar();
  }

  function insertar() {
    const sql = "INSERT INTO productos (categoria_id, nombre, descripcion, precio, stock, stock_minimo, destacado) VALUES (?,?,?,?,?,?,?)";
    conexion.query(sql, [categoria_id, nombre, descripcion, precio, stock, stock_minimo, destacado ? 1 : 0], (err, resultado) => {
      if (err) return res.status(500).json(err);
      const productoId = resultado.insertId;

      const finalizarConImagen = (urlImagen) => {
        if (urlImagen) {
          conexion.query(
            "INSERT INTO producto_imagenes (producto_id, url, es_principal, orden, activo) VALUES (?,?,1,1,1)",
            [productoId, urlImagen],
            () => {}
          );
        }
        if (precio_mayorista && Number(precio_mayorista) > 0) {
          conexion.query(
            "INSERT INTO precios_mayorista (producto_id, precio_mayoreo, cantidad_minima, activo) VALUES (?,?,50,1)",
            [productoId, precio_mayorista],
            () => {}
          );
        }
        res.status(201).json({ mensaje: "Producto creado correctamente", id: productoId });
      };

      if (imagenFile) {
        finalizarConImagen(`uploads/productos/${imagenFile.filename}`);
      } else {
        finalizarConImagen(null);
      }
    });
  }
};

const actualizarProducto = (req, res) => {
  const { id } = req.params;
  const { categoria_id, nombre, descripcion, precio, precio_mayorista, stock, stock_minimo, destacado } = req.body;
  const imagenFile = req.file;

  if (Number(destacado) === 1) {
    conexion.query("SELECT COUNT(*) AS total FROM productos WHERE destacado = 1 AND activo = 1 AND id <> ?", [id], (err, r) => {
      if (err) return res.status(500).json(err);
      if (r[0].total >= 3) return res.status(400).json({ mensaje: "Solo se permiten 3 productos destacados" });
      actualizar();
    });
  } else {
    actualizar();
  }

  function actualizar() {
    const sql = "UPDATE productos SET categoria_id=?, nombre=?, descripcion=?, precio=?, stock=?, stock_minimo=?, destacado=? WHERE id=?";
    conexion.query(sql, [categoria_id, nombre, descripcion, precio, stock, stock_minimo, destacado ? 1 : 0, id], (err) => {
      if (err) return res.status(500).json(err);

      if (imagenFile) {
        const urlImagen = `uploads/productos/${imagenFile.filename}`;
        conexion.query("UPDATE producto_imagenes SET activo = 0 WHERE producto_id = ?", [id], () => {
          conexion.query(
            "INSERT INTO producto_imagenes (producto_id, url, es_principal, orden, activo) VALUES (?,?,1,1,1)",
            [id, urlImagen],
            () => {}
          );
        });
      }

      // Actualizar precio mayorista
      if (precio_mayorista !== undefined) {
        if (Number(precio_mayorista) > 0) {
          conexion.query(
            "INSERT INTO precios_mayorista (producto_id, precio_mayoreo, cantidad_minima, activo) VALUES (?,?,50,1) ON DUPLICATE KEY UPDATE precio_mayoreo=?, activo=1",
            [id, precio_mayorista, precio_mayorista],
            () => {}
          );
        } else {
          conexion.query("UPDATE precios_mayorista SET activo = 0 WHERE producto_id = ?", [id], () => {});
        }
      }

      res.json({ mensaje: "Producto actualizado correctamente" });
    });
  }
};

const desactivarProducto = (req, res) => {
  conexion.query("UPDATE productos SET activo = 0 WHERE id = ?", [req.params.id], (err) => {
    if (err) return res.status(500).json(err);
    res.json({ mensaje: "Producto desactivado correctamente" });
  });
};

const obtenerStockBajo = (req, res) => {
  conexion.query(
    "SELECT id, nombre, stock, stock_minimo FROM productos WHERE activo = 1 AND stock <= stock_minimo ORDER BY stock ASC",
    (err, rows) => {
      if (err) return res.status(500).json(err);
      res.json(rows);
    }
  );
};

module.exports = { obtenerProductos, obtenerProductoPorId, obtenerProductosDestacados, obtenerCategorias, crearProducto, actualizarProducto, desactivarProducto, obtenerStockBajo };
