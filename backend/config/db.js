const mysql = require("mysql2");

const conexion = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
});

conexion.connect((error) => {
  if (error) {
    console.log("Error de conexión:");
    console.log(error);
    return;
  }

  console.log("MySQL conectado");
});

module.exports = conexion;