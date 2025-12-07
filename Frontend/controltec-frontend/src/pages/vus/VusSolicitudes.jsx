// src/pages/vus/VusSolicitudes.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/apiClient";
import { useAuth } from "../context/AuthContext";

export default function VusSolicitudes() {
  const { usuario } = useAuth();
  const navigate = useNavigate();

  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // VUS trabaja principalmente con solicitudes en "Aprobación DNCD"
  const ESTADO_OBJETIVO = "Aprobación DNCD";

  useEffect(() => {
    const cargarSolicitudes = async () => {
      setLoading(true);
      setError("");

      try {
        // ⚠️ BACKEND: este endpoint ahora mismo es solo Admin.
        // En el backend, en GetSolicitudesFiltro, deben incluir VUS en [Authorize]
        // [Authorize(Roles = "Admin")]  →  "Admin,VUS"
        const res = await api.get(
          `/api/Solicitudes/filtro?estado=${encodeURIComponent(
            ESTADO_OBJETIVO
          )}`
        );
        setSolicitudes(res.data || []);
      } catch (err) {
        console.error("Error cargando solicitudes VUS:", err);
        setError(
          err.response?.status === 403 || err.response?.status === 401
            ? "No tienes permiso para ver las solicitudes. Asegúrate de que el rol VUS está habilitado en el backend para este endpoint."
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
    const e = estado.toLowerCase();
    if (e.includes("rechaz") || e.includes("devuelt")) return "badge badge-danger";
    if (e.includes("aprob")) return "badge badge-success";
    return "badge badge-warning";
  };

  return (
    <div className="page-container solicitudes-page">
      <div className="solicitudes-header">
        <div>
          <h1 className="solicitudes-title">Bandeja VUS</h1>
          <p className="solicitudes-subtitle">
            Revisa las solicitudes que han pasado por DNCD y valida que los
            documentos estén completos.
          </p>
        </div>
      </div>

      {loading && <p>Cargando solicitudes...</p>}
      {error && !loading && <p className="login-error">{error}</p>}

      {!loading && !error && solicitudes.length === 0 && (
        <p className="solicitudes-empty">
          No hay solicitudes en estado "{ESTADO_OBJETIVO}" en este momento.
        </p>
      )}

      {!loading && !error && solicitudes.length > 0 && (
        <div className="solicitudes-table-wrapper">
          <table className="solicitudes-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Solicitante</th>
                <th>Servicio</th>
                <th>Estado</th>
                <th>Fecha</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {solicitudes.map((s) => (
                <tr key={s.id}>
                  <td>{s.id}</td>
                  <td>{s.usuario?.nombre}</td>
                  <td>{s.servicio?.nombre}</td>
                  <td>
                    <span className={getEstadoClass(s.estado)}>
                      {s.estado}
                    </span>
                  </td>
                  <td>{formatFecha(s.fechaCreacion)}</td>
                  <td>
                    <button
                      type="button"
                      className="btn-link-table"
                      // VUS abre el mismo detalle que el usuario, pero con acciones extra
                      onClick={() => navigate(`/solicitudes/${s.id}`)}
                    >
                      Ver detalles
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
