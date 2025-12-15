// src/pages/vus/VusSolicitudes.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
// Ya no se usa CSS Module, solo global.css



export default function VusSolicitudes() {
  const navigate = useNavigate();

  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cedula, setCedula] = useState("");

  // Estados objetivo bandeja VUS
  const ESTADOS_OBJETIVO = ["Depositada", "DepositadaFase1", "DepositadaFase2"];

  useEffect(() => {
    const cargarSolicitudes = async () => {
      setLoading(true);
      setError("");

      try {
        const res = await api.get("/api/Solicitudes");
        const data = res.data || [];

        const filtradas = data.filter((s) =>
          ESTADOS_OBJETIVO.includes(String(s.estado || ""))
        );

        setSolicitudes(filtradas);
      } catch (err) {
        console.error("Error cargando solicitudes VUS:", err);
        setError(
          err.response?.status === 403 || err.response?.status === 401
            ? "No tienes permiso para ver las solicitudes."
            : "No se pudieron cargar las solicitudes."
        );
      } finally {
        setLoading(false);
      }
    };

    cargarSolicitudes();
  }, []);

  const formatFecha = (fechaStr) => {
    if (!fechaStr) return "-";
    const d = new Date(fechaStr);
    if (Number.isNaN(d.getTime())) return "-";
    return d.toLocaleDateString("es-DO", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  const getEstadoClass = (estado = "") => {
    const e = String(estado).toLowerCase();

    if (e.includes("rechaz") || e.includes("cancel")) return "ct-badge ct-badge-danger";
    if (e.includes("aprob") || e.includes("completad")) return "ct-badge ct-badge-success";
    if (e.includes("pendiente") || e.includes("depositad")) return "ct-badge ct-badge-warning";
    if (e.includes("revision") || e.includes("revisión")) return "ct-badge ct-badge-warning";
    return "ct-badge ct-badge-neutral";
  };

  const solicitudesFiltradas = useMemo(() => {
    const c = (cedula || "").trim();
    if (!c) return solicitudes;

    return solicitudes.filter((s) => {
      const ced = s.usuario?.cedula || s.usuario?.Cedula || "";
      return String(ced).includes(c);
    });
  }, [cedula, solicitudes]);

  return (
    <div className="ct-page-container">
      <div className="ct-header">
        <div className="ct-title-group">
          <h1 className="ct-title">Solicitudes VUS</h1>
          <p className="ct-subtitle">Revisa el estado y avance de las solicitudes pendientes de validación por VUS.</p>
        </div>
        <button
          type="button"
          className="ct-btn ct-btn-primary"
          onClick={() => navigate("/vus/solicitudes/nueva")}
        >
          Nueva solicitud
        </button>
      </div>

      {/* Notificación de éxito si aplica */}
      {/* Puedes agregar aquí una notificación si tu flujo lo requiere */}

      {/* Buscar por cédula (arriba) */}
      <div className="ct-card" style={{ marginBottom: "1rem" }}>
        <div className="ct-card-body">
          <h3 className="ct-card-title" style={{ marginBottom: "0.75rem" }}>
            Buscar por Cédula
          </h3>

          <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: "0.75rem" }}>
            <input
              className="vs-input"
              placeholder="Ingrese el número de cédula..."
              value={cedula}
              onChange={(e) => setCedula(e.target.value)}
              inputMode="numeric"
            />

            <button type="button" className="ct-btn ct-btn-primary">
              Buscar
            </button>
          </div>
        </div>
      </div>

      {/* Estados */}
      {loading && <p className="ct-loading">Cargando solicitudes...</p>}
      {error && !loading && <p className="ct-error">{error}</p>}

      {!loading && !error && solicitudesFiltradas.length === 0 && (
        <p className="ct-empty">No hay solicitudes pendientes de revisión.</p>
      )}

      {/* Tabla */}
      {!loading && !error && solicitudesFiltradas.length > 0 && (
        <div className="ct-table-wrap">
          <table className="ct-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Servicio</th>
                <th>Solicitante</th>
                <th>Estado</th>
                <th>Fecha</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {solicitudesFiltradas.map((s) => (
                <tr key={s.id}>
                  <td>{s.id}</td>
                  <td>{s.servicio?.nombre || "-"}</td>
                  <td>{s.usuario?.nombre || "-"}</td>
                  <td>
                    <span className="ct-badge ct-badge-neutral">{s.estado || "-"}</span>
                  </td>
                  <td>{formatFecha(s.fechaCreacion)}</td>
                  <td>
                    <button
                      type="button"
                      className="ct-btn-details"
                      onClick={() => navigate(`/solicitudes/${s.id}`)}
                    >
                      Revisar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

