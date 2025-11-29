// src/components/Navbar.jsx
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";  // <-- AQUÍ EL CAMBIO

export default function Navbar() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav
      style={{
        display: "flex",
        justifyContent: "space-between",
        padding: "0.75rem 1.5rem",
        background: "#020617",
        color: "#e5e7eb",
      }}
    >
      <div>
        <strong>ControlTec</strong>
      </div>

      <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
        {usuario && (
          <>
            <span>
              {usuario.nombre} ({usuario.roll})
            </span>
            <Link to="/dashboard" style={{ color: "#e5e7eb" }}>
              Dashboard
            </Link>
            <Link to="/mis-solicitudes" style={{ color: "#e5e7eb" }}>
              Mis solicitudes
            </Link>
            <button
              onClick={handleLogout}
              style={{
                padding: "0.35rem 0.8rem",
                borderRadius: "0.5rem",
                border: "1px solid #475569",
                background: "#0f172a",
                color: "#e5e7eb",
                cursor: "pointer",
              }}
            >
              Cerrar sesión
            </button>
          </>
        )}
      </div>
    </nav>
  );
}
