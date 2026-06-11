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



app.use("/productos", productosRoutes);
app.use("/pedidos", pedidosRoutes);
app.use("/clientes", clientesRoutes);
app.use("/resumen", resumenRoutes);
app.use("/facturas", facturasRoutes);
app.use("/auth/clientes", authClientesRoutes);

app.get("/", (req, res) => {
  res.send("API Distribuidora S.M funcionando");
});


const PORT = process.env.PORT || 3000;


app.listen(PORT, () => {
  console.log(
    `Servidor ejecutándose en puerto ${PORT}`
  );
});