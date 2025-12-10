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

  // Normalizamos el rol para evitar problemas con Roll / roll / role
  const rol = (
    usuario?.roll ??
    usuario?.Roll ??
    usuario?.rol ??
    usuario?.role ??
    ""
  ).trim();

  // Redirección según rol al hacer clic en el logo
  const goHomeByRole = () => {
    if (rol === "Admin") navigate("/admin");
    else if (rol === "Solicitante") navigate("/mis-solicitudes");
    else if (rol === "VUS") navigate("/vus/solicitudes");
    else if (rol === "TecnicoUPC") navigate("/upc/solicitudes");
    else if (rol === "EncargadoUPC") navigate("/encargado-upc/solicitudes");
    else if (rol === "DNCD") navigate("/dncd/solicitudes");
    else if (rol === "Direccion") navigate("/direccion/solicitudes");
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
      {/* Logo / Home */}
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

            {/* Solicitante */}
            {rol === "Solicitante" && (
              <Link to="/mis-solicitudes" style={{ color: "#f9fafb" }}>
                Mis solicitudes
              </Link>
            )}

            {/* VUS */}
            {rol === "VUS" && (
              <Link to="/vus/solicitudes" style={{ color: "#f9fafb" }}>
                Bandeja VUS
              </Link>
            )}

            {/* Técnico UPC */}
            {rol === "TecnicoUPC" && (
              <Link to="/upc/solicitudes" style={{ color: "#f9fafb" }}>
                Bandeja Técnico UPC
              </Link>
            )}

            {/* Encargado UPC */}
            {rol === "EncargadoUPC" && (
              <Link to="/encargado-upc/solicitudes" style={{ color: "#f9fafb" }}>
                Bandeja Encargado UPC
              </Link>
            )}

            {/* DNCD */}
            {rol === "DNCD" && (
              <Link to="/dncd/solicitudes" style={{ color: "#f9fafb" }}>
                Bandeja DNCD
              </Link>
            )}

            {/* Dirección */}
            {rol === "Direccion" && (
              <Link to="/direccion/solicitudes" style={{ color: "#f9fafb" }}>
                Bandeja Dirección
              </Link>
            )}

            {/* Admin */}
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

            {/* Logout */}
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
