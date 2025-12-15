// src/components/Navbar.jsx
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Navbar.css"; // Import new styles

export default function Navbar() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Normalizamos el rol
  const rol = (
    usuario?.roll ??
    usuario?.Roll ??
    usuario?.rol ??
    usuario?.role ??
    ""
  ).trim();

  const nombre = usuario?.nombre || "Usuario";

  // Helper para iniciales (ej: Carlos Pérez -> CP)
  const getInitials = (name) => {
    if (!name) return "U";
    const parts = name.split(" ").filter(Boolean);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  };

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
    <nav className="navbar">
      {/* Brand / Logo */}
      <div className="navbar-brand" onClick={goHomeByRole}>
        <div className="navbar-logo-icon">C</div>
        <span className="navbar-logo-text">ControlTec</span>
      </div>

      <div className="navbar-actions">
        {usuario && (
          <>
            {/* Links based on Rol */}
            {rol === "Solicitante" && (
              <Link to="/mis-solicitudes" className="navbar-link">
                Mis solicitudes
              </Link>
            )}
            {rol === "VUS" && (
              <Link to="/vus/solicitudes" className="navbar-link">
                Bandeja VUS
              </Link>
            )}
            {rol === "TecnicoUPC" && (
              <Link to="/upc/solicitudes" className="navbar-link">
                Bandeja Técnico UPC
              </Link>
            )}
            {rol === "EncargadoUPC" && (
              <Link to="/encargado-upc/solicitudes" className="navbar-link">
                Bandeja Encargado UPC
              </Link>
            )}
            {rol === "DNCD" && (
              <Link to="/dncd/solicitudes" className="navbar-link">
                Bandeja DNCD
              </Link>
            )}
            {rol === "Direccion" && (
              <Link to="/direccion/solicitudes" className="navbar-link">
                Bandeja Dirección
              </Link>
            )}
            {rol === "Admin" && (
              <>
                <Link to="/admin" className="navbar-link">Inicio</Link>
                <Link to="/admin/usuarios" className="navbar-link">Usuarios</Link>
                <Link to="/admin/servicios" className="navbar-link">Servicios</Link>
              </>
            )}

            <div className="navbar-divider"></div>

            {/* User Info */}
            <div className="navbar-user">
              <div className="navbar-user-info">
                <span className="navbar-user-name">{nombre}</span>
                <span className="navbar-user-role">{rol}</span>
              </div>
              <div className="navbar-avatar">{getInitials(nombre)}</div>
            </div>

            {/* Logout Button */}
            <button className="navbar-logout" onClick={handleLogout} title="Cerrar sesión">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9"
                />
              </svg>
            </button>
          </>
        )}
      </div>
    </nav>
  );
}
