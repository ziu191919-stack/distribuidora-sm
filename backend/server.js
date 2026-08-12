require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");


const app = express();

app.use(cors());
app.use(express.json());

app.use(
  "/uploads",
  express.static(
    path.join(__dirname, "uploads")
  )
);

require("./config/db");

const productosRoutes = require("./routes/productos.routes");
const pedidosRoutes =  require("./routes/pedidos.routes");
const clientesRoutes = require("./routes/clientes.routes");
const resumenRoutes = require("./routes/resumen.routes");
const facturasRoutes = require("./routes/facturas.routes");
const authClientesRoutes = require("./routes/auth.clientes.routes");
const authAdminRoutes = require("./routes/auth.admin.routes");
const ubicacionesRoutes = require("./routes/ubicaciones.routes");
const sociosComercialesRoutes = require("./routes/sociosComerciales.routes");
const tseRoutes = require("./routes/tse.routes");
const paypalRoutes = require("./routes/paypal.routes");
const bancoRoutes = require("./routes/banco.routes");
const bccrRoutes = require("./routes/bccr.routes");



app.use("/productos", productosRoutes);
app.use("/pedidos", pedidosRoutes);
app.use("/clientes", clientesRoutes);
app.use("/resumen", resumenRoutes);
app.use("/facturas", facturasRoutes);
app.use("/auth/clientes", authClientesRoutes);
app.use("/auth/admin", authAdminRoutes);
app.use("/ubicaciones", ubicacionesRoutes);
app.use("/socios", sociosComercialesRoutes);
app.use("/tse", tseRoutes);
app.use("/paypal", paypalRoutes);
app.use("/banco", bancoRoutes);
app.use("/bccr", bccrRoutes);

app.get("/", (req, res) => {
  res.send("API Distribuidora S.M funcionando");
});

// Manejador de errores global — sin esto, un error dentro de un middleware
// (como multer/Cloudinary al subir una imagen) queda sin capturar y Express
// devuelve una página HTML por defecto en vez de JSON, rompiendo el frontend.
// Con esto, siempre se responde JSON, y el mensaje real del error queda visible
// en los logs de Render para poder diagnosticarlo.
app.use((err, req, res, next) => {
  console.error("Error no capturado:", err.message);
  console.error(err.stack);
  res.status(500).json({
    mensaje: "Error interno del servidor",
    detalle: err.message,
  });
});


const PORT = process.env.PORT || 3000;


app.listen(PORT, () => {
  console.log(
    `Servidor ejecutándose en puerto ${PORT}`
  );
});