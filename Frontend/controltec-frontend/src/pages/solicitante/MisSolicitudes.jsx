// src/pages/solicitante/MisSolicitudes.jsx
import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../../api/apiClient";
import { useAuth } from "../../context/AuthContext";
import "./MisSolicitudes.css"; // Import new styles

export default function MisSolicitudes() {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const successMessage = location.state?.successMessage;

  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const cargarSolicitudes = async () => {
      if (!usuario) return;

      setLoading(true);
      setError("");

      try {
        const usuarioId = usuario.id ?? usuario.Id;
        const res = await api.get(`/api/Solicitudes/usuario/${usuario.id}`);
        setSolicitudes(res.data);
      } catch (err) {
        console.error(err);
        setError("No se pudieron cargar tus solicitudes.");
      } finally {
        setLoading(false);
      }
    };

    cargarSolicitudes();
  }, [usuario]);

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
    if (e.includes("rechaz") || e.includes("cancel"))
      return "ms-badge ms-badge-danger";
    if (e.includes("aprob") || e.includes("completad")) return "ms-badge ms-badge-success";
    if (e.includes("pendiente") || e.includes("depositad")) return "ms-badge ms-badge-warning";
    return "ms-badge ms-badge-neutral";
  };

  return (
    <div className="ms-page-container">
      {/* Header */}
      <div className="ms-header">
        <div className="ms-title-group">
          <h1 className="ms-title">Mis solicitudes</h1>
          <p className="ms-subtitle">
            Revisa el estado y avance de tus solicitudes en ControlTec.
          </p>
        </div>

        <button
          type="button"
          className="ms-btn-new"
          onClick={() => navigate("/solicitudes/nueva")}
        >
          Iniciar nueva solicitud
        </button>
      </div>

      {/* Notificación de éxito si venimos de NuevaSolicitud */}
      {successMessage && (
        <div className="notification-success" style={{ marginBottom: '1rem' }}>{successMessage}</div>
      )}

      {/* Estados de carga / error */}
      {loading && <p className="ms-loading">Cargando solicitudes...</p>}

      {error && !loading && <p className="ms-error">{error}</p>}

      {!loading && !error && solicitudes.length === 0 && (
        <p className="ms-empty">
          Aún no tienes solicitudes registradas.
        </p>
      )}

      {/* Tabla */}
      {!loading && !error && solicitudes.length > 0 && (
        <div className="ms-table-container">
          <table className="ms-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Servicio</th>
                <th>Estado</th>
                <th>Fecha</th>
                <th>Costo</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {solicitudes.map((s) => (
                <tr key={s.id}>
                  <td>{s.id}</td>
                  <td>{s.servicio?.nombre}</td>
                  <td>
                    <span className={getEstadoClass(s.estado)}>
                      {s.estado}
                    </span>
                  </td>
                  <td>{formatFecha(s.fechaCreacion)}</td>
                  <td>
                    {s.servicio?.costo?.toLocaleString("es-DO", {
                      style: "currency",
                      currency: "DOP",
                      minimumFractionDigits: 2,
                    })}
                  </td>
                  <td>
                    <button
                      type="button"
                      className="ms-btn-action"
                      onClick={() => navigate(`/solicitudes/${s.id}`)}
                    >
                      Ver
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
