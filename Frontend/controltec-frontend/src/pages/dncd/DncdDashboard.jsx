// src/pages/dncd/DncdDashboard.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/apiClient";
import { useAuth } from "../../context/AuthContext";

const normalizar = (s = "") =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

export default function DncdDashboard() {
  const { usuario } = useAuth();
  const navigate = useNavigate();

  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const ESTADO_OBJETIVO = "Aprobación DIGEAMPS";

  useEffect(() => {
    const cargarSolicitudes = async () => {
      setLoading(true);
      setError("");

      try {
        // El backend ya filtra por rol DNCD. Aquí afinamos por estado.
        const res = await api.get("/api/Solicitudes");
        const data = res.data || [];

        const enDncd = data.filter(
          (s) => normalizar(s.estado) === "aprobacion digeamps"
        );

        setSolicitudes(enDncd);
      } catch (err) {
        console.error("Error cargando solicitudes DNCD:", err);
        const status = err.response?.status;

        if (status === 401) {
          setError("Tu sesión ha expirado. Vuelve a iniciar sesión.");
        } else if (status === 403) {
          setError(
            "No tienes permiso para ver estas solicitudes. Verifica que el rol DNCD tenga acceso al endpoint /api/Solicitudes."
          );
        } else {
          setError("No se pudieron cargar las solicitudes.");
        }
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
    return d.toLocaleString("es-DO", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getEstadoClass = (estado = "") => {
    const e = estado.toLowerCase();
    if (e.includes("rechaz") || e.includes("devuelt"))
      return "badge badge-danger";
    if (e.includes("aprob")) return "badge badge-success";
    return "badge badge-warning";
  };

  const rolTexto = (usuario?.roll ?? usuario?.Roll ?? "").trim();

  return (
    <div className="vus-layout">
      <header className="vus-header">
        <div>
          <h1>Bandeja DNCD</h1>
          <p>
            Revisa las solicitudes en estado{" "}
            <strong>{ESTADO_OBJETIVO}</strong> remitidas desde DIGEAMPS, y
            decide si las apruebas (Aprobación DNCD), las devuelves o las
            rechazas.
          </p>
        </div>
        {usuario && (
          <div className="solicitudes-user">
            <span>
              {usuario.nombre} ({rolTexto})
            </span>
          </div>
        )}
      </header>

      {loading ? (
        <p className="detalle-muted">Cargando solicitudes...</p>
      ) : error ? (
        <p className="login-error">{error}</p>
      ) : solicitudes.length === 0 ? (
        <p className="detalle-muted">
          No hay solicitudes en <strong>{ESTADO_OBJETIVO}</strong> para revisar.
        </p>
      ) : (
        <div className="tabla-wrapper">
          <table className="tabla-solicitudes tabla-vus">
            <thead>
              <tr>
                <th style={{ width: "70px" }}>ID</th>
                <th>Servicio</th>
                <th style={{ width: "190px" }}>Solicitante</th>
                <th style={{ width: "140px" }}>Estado</th>
                <th style={{ width: "190px" }}>Fecha creación</th>
                <th style={{ width: "80px" }}></th>
              </tr>
            </thead>
            <tbody>
              {solicitudes.map((s) => (
                <tr key={s.id}>
                  <td>{s.id}</td>
                  <td className="col-servicio">{s.servicio?.nombre}</td>
                  <td>{s.usuario?.nombre ?? "N/D"}</td>
                  <td>
                    <span className={getEstadoClass(s.estado)}>{s.estado}</span>
                  </td>
                  <td>{formatFecha(s.fechaCreacion)}</td>
                  <td>
                    <button
                      type="button"
                      className="btn-secondary btn-sm btn-full"
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
