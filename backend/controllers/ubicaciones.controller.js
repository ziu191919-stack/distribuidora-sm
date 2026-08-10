const conexion = require("../config/db");

// GET /api/ubicaciones/paises
const obtenerPaises = (req, res) => {
    conexion.query(
        "SELECT id_pais, nombre FROM pais WHERE activo = 1 ORDER BY nombre ASC",
        (err, rows) => {
            if (err) return res.status(500).json(err);
            res.json(rows);
        }
    );
};

// GET /api/ubicaciones/provincias/:id_pais
const obtenerProvinciasPorPais = (req, res) => {
    const { id_pais } = req.params;
    conexion.query(
        "SELECT id_provincia, nombre FROM provincia WHERE id_pais = ? AND activo = 1 ORDER BY nombre ASC",
        [id_pais],
        (err, rows) => {
            if (err) return res.status(500).json(err);
            res.json(rows);
        }
    );
};

// GET /api/ubicaciones/cantones/:id_provincia
const obtenerCantonesPorProvincia = (req, res) => {
    const { id_provincia } = req.params;
    conexion.query(
        "SELECT id_canton, nombre FROM canton WHERE id_provincia = ? AND activo = 1 ORDER BY nombre ASC",
        [id_provincia],
        (err, rows) => {
            if (err) return res.status(500).json(err);
            res.json(rows);
        }
    );
};

// GET /api/ubicaciones/distritos/:id_canton
const obtenerDistritosPorCanton = (req, res) => {
    const { id_canton } = req.params;
    conexion.query(
        "SELECT id_distrito, nombre FROM distrito WHERE id_canton = ? AND activo = 1 ORDER BY nombre ASC",
        [id_canton],
        (err, rows) => {
            if (err) return res.status(500).json(err);
            res.json(rows);
        }
    );
};

module.exports = {
    obtenerPaises,
    obtenerProvinciasPorPais,
    obtenerCantonesPorProvincia,
    obtenerDistritosPorCanton
};