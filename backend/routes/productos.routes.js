const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const { obtenerProductos, obtenerProductoPorId, obtenerProductosDestacados, obtenerCategorias, crearProducto, actualizarProducto, desactivarProducto, obtenerStockBajo } = require("../controllers/productos.controller");

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, "../uploads/productos")),
  filename: (req, file, cb) => {
    const nombre = file.originalname.replace(/\s+/g, "_").toLowerCase();
    cb(null, Date.now() + "_" + nombre);
  },
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

router.get("/destacados", obtenerProductosDestacados);
router.get("/", obtenerProductos);
router.get("/categorias", obtenerCategorias);
router.get("/stock-bajo", obtenerStockBajo);
router.get("/:id", obtenerProductoPorId);
router.post("/", upload.single("imagen"), crearProducto);
router.put("/:id", upload.single("imagen"), actualizarProducto);
router.put("/desactivar/:id", desactivarProducto);

module.exports = router;
