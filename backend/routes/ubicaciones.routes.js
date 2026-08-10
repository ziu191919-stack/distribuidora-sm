const express = require("express");
const router = express.Router();
const {
    obtenerPaises,
    obtenerProvinciasPorPais,
    obtenerCantonesPorProvincia,
    obtenerDistritosPorCanton
} = require("../controllers/ubicaciones.controller");

router.get("/paises", obtenerPaises);
router.get("/provincias/:id_pais", obtenerProvinciasPorPais);
router.get("/cantones/:id_provincia", obtenerCantonesPorProvincia);
router.get("/distritos/:id_canton", obtenerDistritosPorCanton);

module.exports = router;