// src/pages/Dashboard.jsx
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";

export default function Dashboard() {
  return (
    <div className="page-container">
      <h1 className="dashboard-title">Dashboard</h1>
      <p className="dashboard-subtitle">
        Bienvenido, Pedro (Solicitante)
      </p>

      <div className="card">
        <h3>Información general</h3>
        <p>Aquí agregaremos gráficos, métricas y resumen de solicitudes.</p>
      </div>

      <div className="card">
        <h3>Actividades recientes</h3>
        <p>Historial y cambios importantes en tus solicitudes.</p>
      </div>
    </div>
  );
}

