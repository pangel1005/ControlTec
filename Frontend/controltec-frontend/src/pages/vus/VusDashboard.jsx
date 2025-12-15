// src/pages/vus/VusDashboard.jsx
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/apiClient";

// Components
import DashboardKpi from "../../components/DashboardKpi";
import DashboardFilter from "../../components/DashboardFilter";

// Styles
import "./VusDashboard.css";

// Utilities
const normalizarEstado = (s = "") =>
  (s ?? "")
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, "");

const formatearFecha = (fechaStr) => {
  if (!fechaStr) return "N/D";
  const d = new Date(fechaStr);
  if (Number.isNaN(d.getTime())) return "N/D";
  return d.toLocaleString("es-DO", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
};

const ESTADOS_VUS = new Set(["depositada", "depositadafase1", "depositadafase2"]);

export default function VusDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [solicitudes, setSolicitudes] = useState([]);

  // Filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [filterFase, setFilterFase] = useState("");

  useEffect(() => {
    cargarSolicitudes();
  }, []);

  const cargarSolicitudes = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/api/Solicitudes");
      const todas = res.data || [];
      // Solo las de VUS
      const vus = todas.filter((s) => ESTADOS_VUS.has(normalizarEstado(s?.estado)));
      setSolicitudes(vus);
    } catch (err) {
      console.error("Error cargando solicitudes VUS:", err);
      setError("No se pudieron cargar las solicitudes.");
    } finally {
      setLoading(false);
    }
  };

  // 1. Calcular KPIs
  const kpis = useMemo(() => {
    const counts = {
      depositada: 0,
      depositadafase1: 0,
      depositadafase2: 0,
    };

    solicitudes.forEach((s) => {
      const est = normalizarEstado(s.estado);
      if (counts[est] !== undefined) {
        counts[est]++;
      }
    });

    return counts;
  }, [solicitudes]);

  // 2. Filtrar Datos
  const datosFiltrados = useMemo(() => {
    return solicitudes.filter((s) => {
      // Filtro de Fase
      const estadoNorm = normalizarEstado(s.estado);
      if (filterFase && estadoNorm !== filterFase) return false;

      // Filtro de Búsqueda
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const id = s.id?.toString() || "";
        const solicitante = s.usuario?.nombre?.toLowerCase() || "";
        const servicio = s.servicio?.nombre?.toLowerCase() || "";

        return id.includes(term) || solicitante.includes(term) || servicio.includes(term);
      }

      return true;
    });
  }, [solicitudes, filterFase, searchTerm]);

  // Helpers UI
  const getBadgeClass = (estado) => {
    const est = normalizarEstado(estado);
    return `status-pill ${est}`; // depositada, depositadafase1, etc.
  };

  const getInitials = (name) => {
    return (name || "U").substring(0, 2).toUpperCase();
  };

  return (
    <div className="ct-app">
      <div className="ct-page-container">
        <header className="ct-header">
          <div className="ct-title-group">
            <h1 className="ct-title">Panel de Control VUS</h1>
            <p className="ct-subtitle">Gestiona y valida las solicitudes entrantes.</p>
          </div>
        </header>

        {/* KPIs Section */}
        <div className="vus-kpi-grid">
          <DashboardKpi
            value={kpis.depositada}
            label="Nuevas Solicitudes"
            type="blue"
            iconKey="depositada"
            onClick={() => setFilterFase(filterFase === "depositada" ? "" : "depositada")}
          />
          <DashboardKpi
            value={kpis.depositadafase1}
            label="En Fase 1 (Drogas)"
            type="amber"
            iconKey="fase1"
            onClick={() => setFilterFase(filterFase === "depositadafase1" ? "" : "depositadafase1")}
          />
          <DashboardKpi
            value={kpis.depositadafase2}
            label="En Fase 2 (Final)"
            type="green"
            iconKey="fase2"
            onClick={() => setFilterFase(filterFase === "depositadafase2" ? "" : "depositadafase2")}
          />
        </div>

        {/* Filter Bar */}
        <DashboardFilter
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          filterFase={filterFase}
          onFilterChange={setFilterFase}
        />

        {/* Main Table Card */}
        <section className="vus-table-container">
          {loading ? (
            <div style={{ padding: 40, textAlign: "center", color: "#6b7280" }}>Cargando datos...</div>
          ) : error ? (
            <div style={{ padding: 20, color: "red" }}>{error}</div>
          ) : datosFiltrados.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center", color: "#6b7280" }}>
              No se encontraron solicitudes con estos filtros.
            </div>
          ) : (
            <table className="vus-table">
              <thead>
                <tr>
                  <th width="80">ID</th>
                  <th>Servicio</th>
                  <th>Solicitante</th>
                  <th>Estado</th>
                  <th>Fecha</th>
                  <th width="100">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {datosFiltrados.map((s) => (
                  <tr key={s.id}>
                    <td className="text-bold text-gray">#{s.id}</td>
                    <td>{s.servicio?.nombre}</td>
                    <td>
                      <div className="user-cell">
                        <div className="user-avatar">{getInitials(s.usuario?.nombre)}</div>
                        <span className="user-name">{s.usuario?.nombre}</span>
                      </div>
                    </td>
                    <td>
                      <span className={getBadgeClass(s.estado)}>
                        {s.estado}
                      </span>
                    </td>
                    <td>{formatearFecha(s.fechaCreacion)}</td>
                    <td>
                      <Link to={`/solicitudes/${s.id}`} className="action-btn">
                        Revisar
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>
    </div>
  );
}
