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

  // Normalizamos el rol igual que en ProtectedRoute
  const rol = (
    usuario?.roll ??
    usuario?.Roll ??
    usuario?.rol ??
    usuario?.role ??
    ""
  ).trim();

  const goHomeByRole = () => {
    if (rol === "Admin") navigate("/admin");
    else if (rol === "Solicitante") navigate("/mis-solicitudes");
    else if (rol === "VUS") navigate("/vus/solicitudes");
    else if (rol === "TecnicoUPC") navigate("/upc/solicitudes");
    else if (rol === "EncargadoUPC") navigate("/encargado-upc/solicitudes");
    else if (rol === "DNCD") navigate("/dncd/solicitudes");
    else navigate("/login");
  };

  return (
    <nav
      style={{
        display: "flex",
        justifyContent: "space-between",
        padding: "0.75rem 1.5rem",
        background: "#065f46",
        color: "#f9fafb",
        alignItems: "center",
      }}
    >
      {/* Logo / Inicio */}
      <div
        style={{ fontWeight: "700", cursor: "pointer", fontSize: "1.2rem" }}
        onClick={goHomeByRole}
      >
        ControlTec
      </div>

      <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
        {usuario && (
          <>
            <span>
              {usuario.nombre} ({rol})
            </span>

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

            {rol === "TecnicoUPC" && (
              <Link to="/upc/solicitudes" style={{ color: "#f9fafb" }}>
                Bandeja Técnico UPC
              </Link>
            )}

            {rol === "EncargadoUPC" && (
              <Link
                to="/encargado-upc/solicitudes"
                style={{ color: "#f9fafb" }}
              >
                Bandeja Encargado UPC
              </Link>
            )}

            {rol === "DNCD" && (
              <Link to="/dncd/solicitudes" style={{ color: "#f9fafb" }}>
                Bandeja DNCD
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
