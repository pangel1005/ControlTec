// src/pages/solicitudes/MisSolicitudes.jsx
import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../../api/apiClient";
import { useAuth } from "../../context/AuthContext";

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
      return "badge badge-danger";
    if (e.includes("aprob")) return "badge badge-success";
    return "badge badge-warning";
  };

  return (
    <div className="page-container solicitudes-page">
      {/* Header */}
      <div className="solicitudes-header">
        <div>
          <h1 className="solicitudes-title">Mis solicitudes</h1>
          <p className="solicitudes-subtitle">
            Revisa el estado y avance de tus solicitudes en ControlTec.
          </p>
        </div>

        <button
          type="button"
          className="btn-primary solicitudes-new-btn"
          onClick={() => navigate("/solicitudes/nueva")}
        >
          Iniciar nueva solicitud
        </button>
      </div>

      {/* Notificación de éxito si venimos de NuevaSolicitud */}
      {successMessage && (
        <div className="notification-success">{successMessage}</div>
      )}

      {/* Estados de carga / error */}
      {loading && <p>Cargando solicitudes...</p>}

      {error && !loading && <p className="login-error">{error}</p>}

      {!loading && !error && solicitudes.length === 0 && (
        <p className="solicitudes-empty">
          Aún no tienes solicitudes registradas.
        </p>
      )}

      {/* Tabla */}
      {!loading && !error && solicitudes.length > 0 && (
        <div className="solicitudes-table-wrapper">
          <table className="solicitudes-table">
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
                      className="btn-secondary btn-sm"
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
