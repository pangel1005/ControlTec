// src/pages/solicitudes/SolicitudDetalle.jsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api/apiClient";

export default function SolicitudDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [detalle, setDetalle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Para reenvío (UI futura)
  const [reuploadFiles, setReuploadFiles] = useState([]);

  useEffect(() => {
    const cargarDetalle = async () => {
      setLoading(true);
      setError("");

      try {
        // 👇 esta es la ruta REAL del backend
        const res = await api.get(`/api/Solicitudes/${id}/detalle`);
        setDetalle(res.data);
      } catch (err) {
        console.error(err);
        setError("No se pudo cargar el detalle de la solicitud.");
      } finally {
        setLoading(false);
      }
    };

    cargarDetalle();
  }, [id]);

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
    if (e.includes("rechaz") || e.includes("devuelt")) return "badge badge-danger";
    if (e.includes("aprob")) return "badge badge-success";
    return "badge badge-warning";
  };

  const handleDescargarDocumento = (docId) => {
    const base = api.defaults.baseURL || "";
    const url = `${base}/api/Documentos/${docId}/descargar`;
    window.open(url, "_blank");
  };

  const handleReuploadChange = (e) => {
    const files = Array.from(e.target.files || []);
    setReuploadFiles(files);
  };

  const handleEnviarNuevosDocs = () => {
    if (reuploadFiles.length === 0) {
      alert("Debes seleccionar al menos un documento.");
      return;
    }

    // Aquí en el futuro:
    // 1) Subir nuevos documentos
    // 2) Cambiar estado mediante API
    alert(
      "Reenvío de documentos pendiente de implementar en el backend. Solo es una vista de ejemplo."
    );
  };

  const esRechazada =
    detalle?.estado?.toLowerCase().includes("rechaz") ||
    detalle?.estado?.toLowerCase().includes("devuelt");

  const esAprobada = detalle?.estado?.toLowerCase().includes("aprob");

  // =================== RENDER ===================

  if (loading) {
    return (
      <div className="page-container">
        <p>Cargando detalle de la solicitud...</p>
      </div>
    );
  }

  if (error || !detalle) {
    return (
      <div className="page-container">
        <p className="login-error">
          {error || "No se pudo cargar el detalle de la solicitud."}
        </p>
        <button
          type="button"
          className="btn-secondary"
          onClick={() => navigate("/mis-solicitudes")}
        >
          Volver a mis solicitudes
        </button>
      </div>
    );
  }

  const documentosCargados = detalle.documentosCargados || [];
  const documentosRequeridos = detalle.documentosRequeridos || [];
  const historial = detalle.historial || [];

  return (
    <div className="page-container detalle-page">
      <button
        type="button"
        className="btn-secondary btn-sm"
        onClick={() => navigate("/mis-solicitudes")}
      >
        ← Volver a mis solicitudes
      </button>

      <div className="detalle-card">
        <div className="detalle-header">
          <div>
            <h1 className="detalle-title">
              Solicitud #{detalle.id}
            </h1>
            <p className="detalle-subtitle">
              Servicio: {detalle.servicio?.nombre ?? "Sin servicio asociado"}
            </p>
          </div>

          <span className={getEstadoClass(detalle.estado)}>
            {detalle.estado}
          </span>
        </div>

        <div className="detalle-grid">
          {/* Información básica */}
          <section className="detalle-section">
            <h2 className="detalle-section-title">Información general</h2>
            <p>
              <strong>Fecha de creación:</strong>{" "}
              {formatFecha(detalle.fechaCreacion)}
            </p>
            <p>
              <strong>Usuario:</strong>{" "}
              {detalle.usuario?.nombre} ({detalle.usuario?.correo})
            </p>
            <p>
              <strong>Descripción del servicio:</strong>
            </p>
            <p className="detalle-servicio-descripcion">
              {detalle.servicio?.descripcion ??
                "Este servicio no tiene descripción registrada."}
            </p>
          </section>

          {/* Requerimientos */}
          <section className="detalle-section">
            <h2 className="detalle-section-title">Documentos requeridos</h2>
            {documentosRequeridos.length === 0 ? (
              <p className="detalle-muted">
                Este servicio aún no tiene requerimientos configurados.
              </p>
            ) : (
              <ul className="detalle-list">
                {documentosRequeridos.map((req) => (
                  <li key={req.id}>{req.nombre}</li>
                ))}
              </ul>
            )}
          </section>

          {/* Documentos cargados */}
          <section className="detalle-section">
            <h2 className="detalle-section-title">Documentos cargados</h2>
            {documentosCargados.length === 0 ? (
              <p className="detalle-muted">
                Todavía no se han cargado documentos para esta solicitud.
              </p>
            ) : (
              <ul className="detalle-doc-list">
                {documentosCargados.map((doc) => (
                  <li key={doc.id} className="detalle-doc-item">
                    <div>
                      <strong>{doc.nombre}</strong>
                      <div className="detalle-doc-meta">
                        {doc.tipo || "application/pdf"}
                      </div>
                    </div>
                    <button
                      type="button"
                      className="btn-secondary btn-sm"
                      onClick={() => handleDescargarDocumento(doc.id)}
                    >
                      Descargar
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Historial */}
          <section className="detalle-section detalle-full-width">
            <h2 className="detalle-section-title">Historial de estados</h2>
            {historial.length === 0 ? (
              <p className="detalle-muted">
                Aún no hay movimientos registrados para esta solicitud.
              </p>
            ) : (
              <ul className="detalle-list">
                {historial.map((h) => (
                  <li key={h.id}>
                    <strong>{formatFecha(h.fechaCambio)}:</strong>{" "}
                    {h.estadoAnterior
                      ? `${h.estadoAnterior} → ${h.estadoNuevo}`
                      : h.estadoNuevo}
                    {h.usuario && (
                      <>
                        {" "}
                        — por {h.usuario.nombre} ({h.usuario.roll})
                      </>
                    )}
                    {h.comentario && <> — "{h.comentario}"</>}
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Certificación / reenvío */}
          <section className="detalle-section detalle-full-width">
            <h2 className="detalle-section-title">Acciones</h2>

            {esAprobada && (
              <button
                type="button"
                className="btn-primary"
                disabled
                title="Descarga de certificación pendiente de implementar."
              >
                Descargar certificación (próximamente)
              </button>
            )}

            {esRechazada && (
              <div className="detalle-reupload">
                <p className="detalle-muted">
                  La solicitud fue rechazada o devuelta. Puedes adjuntar nuevos
                  documentos para corregirla.
                </p>
                <input
                  type="file"
                  multiple
                  onChange={handleReuploadChange}
                />
                {reuploadFiles.length > 0 && (
                  <ul className="detalle-list">
                    {reuploadFiles.map((f, i) => (
                      <li key={i}>{f.name}</li>
                    ))}
                  </ul>
                )}
                <button
                  type="button"
                  className="btn-primary"
                  onClick={handleEnviarNuevosDocs}
                >
                  Enviar nuevos documentos
                </button>
              </div>
            )}

            {!esAprobada && !esRechazada && (
              <p className="detalle-muted">
                No hay acciones adicionales disponibles para el estado actual.
              </p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
