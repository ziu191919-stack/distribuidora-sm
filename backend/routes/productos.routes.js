const express = require("express");
const router = express.Router();
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary.config");
const {
  obtenerProductos,
  obtenerProductoPorId,
  obtenerProductosDestacados,
  obtenerCategorias,
  crearProducto,
  actualizarProducto,
  desactivarProducto,
  obtenerProductosInactivos,
  activarProducto,
  obtenerStockBajo
} = require("../controllers/productos.controller");

// Antes: multer.diskStorage guardaba el archivo en el disco local del servidor
// (backend/uploads/productos/) — eso se perdía cada vez que Render reiniciaba
// el servicio, porque el disco ahi es temporal.
//
// Ahora: CloudinaryStorage sube la imagen directo a Cloudinary, y el archivo
// nunca toca el disco del servidor — queda guardado de forma permanente.
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "distribuidora-sm/productos",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
  },
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

router.get("/destacados", obtenerProductosDestacados);
router.get("/inactivos", obtenerProductosInactivos);
router.get("/", obtenerProductos);
router.get("/categorias", obtenerCategorias);
router.get("/stock-bajo", obtenerStockBajo);
router.get("/:id", obtenerProductoPorId);
router.post("/", upload.single("imagen"), crearProducto);
router.put("/:id", upload.single("imagen"), actualizarProducto);
router.put("/desactivar/:id", desactivarProducto);
router.put("/activar/:id", activarProducto);

module.exports = router;