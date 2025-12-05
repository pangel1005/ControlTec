// src/pages/admin/AdminDashboard.jsx
import { Link } from "react-router-dom";

export default function AdminDashboard() {
  return (
    <div className="page">
      <h1>Administración de ControlTec</h1>
      <p>
        Desde aquí puedes gestionar usuarios, perfiles y el catálogo de
        servicios/requisitos.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: "1.5rem",
          marginTop: "2rem",
        }}
      >
        {/* Tarjeta Usuarios */}
        <Link
          to="/admin/usuarios"
          style={{ textDecoration: "none", color: "inherit" }}
        >
          <div className="admin-card">
            <div className="admin-card-icon">👥</div>
            <h2 className="admin-card-title">Usuarios y Perfiles</h2>
            <p className="admin-card-text">
              Crear usuarios, asignar roles y administrar accesos a la
              herramienta.
            </p>
          </div>
        </Link>

        {/* Tarjeta Servicios */}
        <Link
          to="/admin/servicios"
          style={{ textDecoration: "none", color: "inherit" }}
        >
          <div className="admin-card">
            <div className="admin-card-icon">📄</div>
            <h2 className="admin-card-title">Catálogo de Servicios</h2>
            <p className="admin-card-text">
              Configurar servicios, formularios y requisitos de cada tipo de
              solicitud.
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
}
