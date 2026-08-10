import { useNavigate } from "react-router-dom";

const API = "http://localhost:3000";

function AdminNavbar({ titulo }) {
  const navigate = useNavigate();

  const cerrarSesion = async () => {
    if (!window.confirm("¿Deseas cerrar la sesión?")) return;
    try {
      const adminData = localStorage.getItem("admin");
      const admin = adminData ? JSON.parse(adminData) : null;
      const token = localStorage.getItem("token_admin");
      await fetch(`${API}/auth/admin/logout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ admin_id: admin?.id }),
      });
    } catch (e) { console.error(e); }
    localStorage.removeItem("token_admin");
    localStorage.removeItem("admin");
    navigate("/admin/login");
  };

  return (
    <nav className="admin-navbar">
      <div className="container">
        <div style={{ display: "flex", alignItems: "center" }}>
          <span className="admin-brand">
            <i className="bi bi-droplet-fill admin-brand-icon"></i>Distribuidora S.M
          </span>
          {titulo && <span className="admin-badge-panel">{titulo}</span>}
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          {titulo !== "Panel Admin" && (
            <button className="btn-dashboard" onClick={() => navigate("/admin")}>
              Dashboard
            </button>
          )}
          <button
            className="btn-dashboard"
            onClick={cerrarSesion}
            style={{ background: "rgba(220,53,69,0.15)", color: "#ff6b6b", border: "1px solid rgba(220,53,69,0.3)" }}
          >
            <i className="bi bi-box-arrow-right me-1"></i>Salir
          </button>
        </div>
      </div>
    </nav>
  );
}

export default AdminNavbar;