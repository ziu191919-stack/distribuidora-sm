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
import RecuperarUsuario from "./pages/RecuperarUsuario";
import ResetPassword from "./pages/ResetPassword";
import AdminLogin from "./pages/admin/AdminLogin";

import AdminDashboard from "./pages/admin/AdminDashboard";
import Pedidos from "./pages/admin/Pedidos";
import Inventario from "./pages/admin/Inventario";
import Clientes from "./pages/admin/Clientes";
import Resumen from "./pages/admin/Resumen";
import Facturas from "./pages/admin/Facturas";
import DemoTSE from "./pages/DemoTSE";

// Verifica token cliente: que exista y no esté expirado
function tokenClienteValido() {
  const token = localStorage.getItem("token_cliente");
  if (!token) return false;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    if (payload.exp && Date.now() / 1000 > payload.exp) {
      localStorage.removeItem("token_cliente");
      localStorage.removeItem("cliente");
      return false;
    }
    return true;
  } catch {
    localStorage.removeItem("token_cliente");
    localStorage.removeItem("cliente");
    return false;
  }
}

// Verifica token admin
function tokenAdminValido() {
  const token = localStorage.getItem("token_admin");
  if (!token) return false;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    if (payload.exp && Date.now() / 1000 > payload.exp) {
      localStorage.removeItem("token_admin");
      return false;
    }
    return true;
  } catch {
    localStorage.removeItem("token_admin");
    return false;
  }
}

function RutaCliente({ children }) {
  return tokenClienteValido() ? children : <Navigate to="/login" replace />;
}

function RutaAdmin({ children }) {
  return tokenAdminValido() ? children : <Navigate to="/admin/login" replace />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Públicas cliente */}
        <Route path="/login" element={<Login />} />
        <Route path="/registro" element={<Registro />} />
        <Route path="/olvide-password" element={<OlvidePassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/recuperar-usuario" element={<RecuperarUsuario />} />

        {/* Protegidas cliente */}
        <Route path="/" element={<RutaCliente><Home /></RutaCliente>} />
        <Route path="/catalogo" element={<RutaCliente><Catalogo /></RutaCliente>} />
        <Route path="/contacto" element={<RutaCliente><Contacto /></RutaCliente>} />
        <Route path="/pedido" element={<RutaCliente><Pedido /></RutaCliente>} />
        <Route path="/producto/:id" element={<RutaCliente><DetalleProducto /></RutaCliente>} />
        <Route path="/mi-cuenta" element={<RutaCliente><MiCuenta /></RutaCliente>} />

        {/* Admin */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<RutaAdmin><AdminDashboard /></RutaAdmin>} />
        <Route path="/inventario" element={<RutaAdmin><Inventario /></RutaAdmin>} />
        <Route path="/admin/pedidos" element={<RutaAdmin><Pedidos /></RutaAdmin>} />
        <Route path="/admin/clientes" element={<RutaAdmin><Clientes /></RutaAdmin>} />
        <Route path="/admin/resumen" element={<RutaAdmin><Resumen /></RutaAdmin>} />
        <Route path="/admin/facturas" element={<RutaAdmin><Facturas /></RutaAdmin>} />
        <Route path="/demo-tse" element={<DemoTSE />} />
        
      </Routes>
    </BrowserRouter>
  );
}

export default App;