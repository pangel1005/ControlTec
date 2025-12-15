// src/pages/encargadoUpc/EncargadoUpcDashboard.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/apiClient";
import { useAuth } from "../../context/AuthContext";

export default function EncargadoUpcDashboard() {
  const { usuario } = useAuth();
  const navigate = useNavigate();

  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const ESTADO_OBJETIVO = "Evaluación Técnica";

  const normalizar = (s = "") =>
    s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

  useEffect(() => {
    const cargarSolicitudes = async () => {
      setLoading(true);
      setError("");

      try {
        // El backend ya filtra por rol EncargadoUPC; aquí afinamos por estado
        const res = await api.get("/api/Solicitudes");
        const data = res.data || [];

        const enEvaluacion = data.filter(
          (s) => normalizar(s.estado) === "evaluacion tecnica"
        );

        setSolicitudes(enEvaluacion);
      } catch (err) {
        console.error("Error cargando solicitudes Encargado UPC:", err);
        const status = err.response?.status;

        if (status === 401) {
          setError("Tu sesión ha expirado. Vuelve a iniciar sesión.");
        } else if (status === 403) {
          setError(
            "No tienes permiso para ver estas solicitudes. Verifica que el rol EncargadoUPC tenga acceso al endpoint /api/Solicitudes."
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
  <div className="ct-app">
    <div className="ct-page-container">
      <header className="ct-header">
        <div className="ct-title-group">
          <h1 className="ct-title">Bandeja Encargado UPC</h1>
          <p className="ct-subtitle">
            Aquí revisas las solicitudes que el Técnico UPC dejó en <strong>{ESTADO_OBJETIVO}</strong> para remitirlas a la siguiente instancia (DIGEAMPS / DNCD) o devolverlas si hay observaciones.
          </p>
        </div>
              </header>
      <section className="ct-card">
        {loading ? (
          <p className="ct-loading">Cargando solicitudes...</p>
        ) : error ? (
          <p className="ct-error">{error}</p>
        ) : solicitudes.length === 0 ? (
          <p className="ct-empty">
            No hay solicitudes en <strong>{ESTADO_OBJETIVO}</strong> para revisar.
          </p>
        ) : (
          <div className="ct-table-wrap">
            <table className="ct-table">
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
                    <td>{s.servicio?.nombre}</td>
                    <td>{s.usuario?.nombre ?? "N/D"}</td>
                    <td>
                      <span className="ct-badge ct-badge-warning">{s.estado}</span>
                    </td>
                    <td>{formatFecha(s.fechaCreacion)}</td>
                    <td>
                      <button
                        type="button"
                        className="ct-btn-details"
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
      </section>
    </div>
  </div>
);
}
