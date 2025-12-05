// src/components/Navbar.jsx
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const rol = usuario?.roll || usuario?.Roll;

  return (
    <nav
      style={{
        display: "flex",
        justifyContent: "space-between",
        padding: "0.75rem 1.5rem",
        background: "#065f46", // verde
        color: "#f9fafb",
      }}
    >
      {/* Logo / título */}
      <div style={{ fontWeight: "700", cursor: "pointer" }} onClick={() => {
        if (rol === "Admin") navigate("/admin");
        else if (rol === "Solicitante") navigate("/mis-solicitudes");
        else if (rol === "VUS") navigate("/vus/solicitudes");
      }}>
        ControlTec
      </div>

      <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
        {usuario && (
          <>
            <span>
              {usuario.nombre} ({rol})
            </span>

            {/* Menú según rol */}
            {rol === "Solicitante" && (
              <Link to="/mis-solicitudes" style={{ color: "#f9fafb" }}>
                Mis solicitudes
              </Link>
            )}

            {rol === "VUS" && (
              <Link to="/vus/solicitudes" style={{ color: "#f9fafb" }}>
                Bandeja VUS
              </Link>
            )}

            {rol === "Admin" && (
              <>
                <Link to="/admin" style={{ color: "#f9fafb" }}>
                  Inicio admin
                </Link>
                <Link to="/admin/usuarios" style={{ color: "#f9fafb" }}>
                  Usuarios
                </Link>
                <Link to="/admin/servicios" style={{ color: "#f9fafb" }}>
                  Servicios
                </Link>
              </>
            )}

            <button
              onClick={handleLogout}
              style={{
                padding: "0.35rem 0.8rem",
                borderRadius: "0.5rem",
                border: "1px solid #bbf7d0",
                background: "#047857",
                color: "#f9fafb",
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
