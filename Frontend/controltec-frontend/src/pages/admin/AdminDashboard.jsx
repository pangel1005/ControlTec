// src/pages/admin/AdminDashboard.jsx
import { Link } from "react-router-dom";

export default function AdminDashboard() {
  return (
    <div className="ct-app">
      <div className="ct-page-container">
        <header className="ct-header">
          <div className="ct-title-group">
            <h1 className="ct-title">Administración de ControlTec</h1>
            <p className="ct-subtitle">
              Desde aquí puedes gestionar usuarios, perfiles y el catálogo de
              servicios/requisitos.
            </p>
          </div>
        </header>

        <div className="ct-grid-2">
          {/* Tarjeta Usuarios */}
          <Link to="/admin/usuarios" className="ct-card" style={{ textDecoration: "none" }}>
            <div className="ct-row" style={{ gap: "0.75rem", alignItems: "center" }}>
              <span style={{ fontSize: 28, lineHeight: 1 }}>👥</span>
              <h2 style={{ margin: 0 }}>Usuarios y Perfiles</h2>
            </div>
            <p style={{ marginTop: "0.6rem", color: "var(--ct-text-muted)" }}>
              Crear usuarios, asignar roles y administrar accesos a la herramienta.
            </p>
          </Link>

          {/* Tarjeta Servicios */}
          <Link to="/admin/servicios" className="ct-card" style={{ textDecoration: "none" }}>
            <div className="ct-row" style={{ gap: "0.75rem", alignItems: "center" }}>
              <span style={{ fontSize: 28, lineHeight: 1 }}>📄</span>
              <h2 style={{ margin: 0 }}>Catálogo de Servicios</h2>
            </div>
            <p style={{ marginTop: "0.6rem", color: "var(--ct-text-muted)" }}>
              Configurar servicios, formularios y requisitos de cada tipo de solicitud.
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}
