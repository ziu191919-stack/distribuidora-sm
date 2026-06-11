import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Home from "./pages/Home";
import Catalogo from "./pages/Catalogo";
import Contacto from "./pages/Contacto";
import Pedido from "./pages/Pedido";
import DetalleProducto from "./pages/DetalleProducto";
import Login from "./pages/Login";
import Registro from "./pages/Registro";
import MiCuenta from "./pages/MiCuenta";
import OlvidePassword from "./pages/OlvidePassword";
import ResetPassword from "./pages/ResetPassword";

import AdminDashboard from "./pages/admin/AdminDashboard";
import Pedidos from "./pages/admin/Pedidos";
import Inventario from "./pages/admin/Inventario";
import Clientes from "./pages/admin/Clientes";
import Resumen from "./pages/admin/Resumen";
import Facturas from "./pages/admin/Facturas";

// Rutas protegidas para clientes
function RutaCliente({ children }) {
  const token = localStorage.getItem("token_cliente");
  return token ? children : <Navigate to="/login" replace />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Públicas */}
        <Route path="/login" element={<Login />} />
        <Route path="/registro" element={<Registro />} />
        <Route path="/olvide-password" element={<OlvidePassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Protegidas cliente */}
        <Route path="/" element={<RutaCliente><Home /></RutaCliente>} />
        <Route path="/catalogo" element={<RutaCliente><Catalogo /></RutaCliente>} />
        <Route path="/contacto" element={<RutaCliente><Contacto /></RutaCliente>} />
        <Route path="/pedido" element={<RutaCliente><Pedido /></RutaCliente>} />
        <Route path="/producto/:id" element={<RutaCliente><DetalleProducto /></RutaCliente>} />
        <Route path="/mi-cuenta" element={<RutaCliente><MiCuenta /></RutaCliente>} />

        {/* Admin (ocultas, sin protección JWT frontend por ahora) */}
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/inventario" element={<Inventario />} />
        <Route path="/admin/pedidos" element={<Pedidos />} />
        <Route path="/admin/clientes" element={<Clientes />} />
        <Route path="/admin/resumen" element={<Resumen />} />
        <Route path="/admin/facturas" element={<Facturas />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
