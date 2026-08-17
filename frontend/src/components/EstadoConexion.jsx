import { useEffect, useState } from "react";

/**
 * Muestra una barra fija arriba de la pantalla cuando el usuario pierde
 * la conexion a internet, y otra breve cuando la recupera.
 * Colocar este componente una sola vez, en App.jsx, fuera de las rutas,
 * para que se vea en toda la app.
 */
function EstadoConexion() {
  const [enLinea, setEnLinea] = useState(navigator.onLine);
  const [mostrarRecuperado, setMostrarRecuperado] = useState(false);

  useEffect(() => {
    const alConectar = () => {
      setEnLinea(true);
      setMostrarRecuperado(true);
      setTimeout(() => setMostrarRecuperado(false), 3000);
    };
    const alDesconectar = () => setEnLinea(false);

    window.addEventListener("online", alConectar);
    window.addEventListener("offline", alDesconectar);
    return () => {
      window.removeEventListener("online", alConectar);
      window.removeEventListener("offline", alDesconectar);
    };
  }, []);

  if (enLinea && !mostrarRecuperado) return null;

  return (
    <div
      role="status"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 2000,
        textAlign: "center",
        padding: "8px 12px",
        fontSize: "0.85rem",
        fontWeight: 600,
        color: "#ffffff",
        background: enLinea ? "#2d6a4f" : "#b02a37",
      }}
    >
      {enLinea
        ? "✅ Conexión recuperada"
        : "📡 Sin conexión a internet — algunos datos podrían no cargar hasta reconectarte"}
    </div>
  );
}

export default EstadoConexion;