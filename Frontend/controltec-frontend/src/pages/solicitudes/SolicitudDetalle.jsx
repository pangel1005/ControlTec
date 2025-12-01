// src/pages/solicitudes/SolicitudDetalle.jsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api/apiClient";
import { useAuth } from "../../context/AuthContext";

export default function SolicitudDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { usuario } = useAuth();

  const [detalle, setDetalle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Para reenvío (solicitante, futuro)
  const [reuploadFiles, setReuploadFiles] = useState([]);

  // Comentario para VUS (aprobación/devolución)
  const [comentarioVus, setComentarioVus] = useState("");

  const rol = (usuario?.roll || usuario?.Roll || "").trim();
  const esVus = rol === "VUS";
  const esSolicitante = rol === "Solicitante";

  // =================== CARGA DE DETALLE ===================

  const cargarDetalle = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await api.get(`/api/Solicitudes/${id}/detalle`);
      setDetalle(res.data);
    } catch (err) {
      console.error(err);
      setError("No se pudo cargar el detalle de la solicitud.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDetalle();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // =================== HELPERS ===================

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

  const handleDescargarDocumento = (docId) => {
    const base = api.defaults.baseURL || "";
    const url = `${base}/api/Documentos/${docId}/descargar`;
    window.open(url, "_blank");
  };

  // =================== REENVÍO (SOLICITANTE, FUTURO) ===================

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
    // 1) Subir nuevos documentos a /api/Solicitudes/{id}/documentos
    // 2) Volver a enviar la solicitud con /api/Solicitudes/{id}/enviar
    alert(
      "Reenvío de documentos pendiente de implementar en el backend. Solo es una vista de ejemplo."
    );
  };

  const esRechazada =
    detalle?.estado?.toLowerCase().includes("rechaz") ||
    detalle?.estado?.toLowerCase().includes("devuelt");

  const esAprobada = detalle?.estado?.toLowerCase().includes("aprob");

  // =================== ACCIONES VUS ===================

  const handleVusAprobar = async () => {
    if (!detalle) return;

    const confirmado = window.confirm(
      '¿Confirmas que la solicitud tiene todos los documentos y debe pasar a "Revisión VUS"?'
    );
    if (!confirmado) return;

    try {
      await api.post(`/api/Solicitudes/${detalle.id}/cambiar-estado`, {
        estadoNuevo: "Revisión VUS", // usa el estado definido en el backend
        comentario: comentarioVus,
      });
      setComentarioVus("");
      await cargarDetalle();
      alert("Solicitud enviada a Revisión VUS.");
    } catch (err) {
      console.error("Error al cambiar estado como VUS:", err);
      alert(
        "No fue posible actualizar el estado. Verifica que el backend permita esta transición para el rol VUS."
      );
    }
  };

  const handleVusRechazar = async () => {
    if (!detalle) return;

    if (!comentarioVus.trim()) {
      alert("Debes indicar el motivo de la devolución.");
      return;
    }

    const confirmado = window.confirm(
      "¿Confirmas que la solicitud será devuelta al solicitante (Rechazada)?"
    );
    if (!confirmado) return;

    try {
      await api.post(`/api/Solicitudes/${detalle.id}/cambiar-estado`, {
        estadoNuevo: "Rechazada",
        comentario: comentarioVus,
      });
      setComentarioVus("");
      await cargarDetalle();
      alert("Solicitud rechazada y comentario registrado.");
    } catch (err) {
      console.error("Error al rechazar como VUS:", err);
      alert(
        "No fue posible rechazar la solicitud. Verifica que el backend permita esta transición para el rol VUS."
      );
    }
  };

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
          onClick={() => navigate("/dashboard")}
        >
          Volver
        </button>
      </div>
    );
  }

  const documentosCargados = detalle.documentosCargados || [];
  const documentosRequeridos = detalle.documentosRequeridos || [];
  const historial = detalle.historial || [];

  let backPath = "/dashboard";
  if (esSolicitante) backPath = "/mis-solicitudes";
  else if (esVus) backPath = "/vus/solicitudes";

  return (
    <div className="page-container detalle-page">
      <button
        type="button"
        className="btn-secondary btn-sm"
        onClick={() => navigate(backPath)}
      >
        ← Volver
      </button>

      <div className="detalle-card">
        <div className="detalle-header">
          <div>
            <h1 className="detalle-title">Solicitud #{detalle.id}</h1>
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
              <strong>Usuario:</strong> {detalle.usuario?.nombre} (
              {detalle.usuario?.correo})
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

          {/* Panel especial para VUS */}
          {esVus && (
            <section className="detalle-section detalle-full-width">
              <h2 className="detalle-section-title">Revisión VUS</h2>
              <p>
                Verifica que todos los documentos requeridos estén cargados. Si
                están completos, pasa la solicitud a{" "}
                <strong>Revisión VUS</strong>. Si faltan documentos, devuélvela
                al solicitante indicando el motivo.
              </p>

              <textarea
                className="detalle-textarea"
                placeholder="Comentario para el solicitante (motivo de la devolución u observaciones)..."
                value={comentarioVus}
                onChange={(e) => setComentarioVus(e.target.value)}
              />

              <div className="detalle-actions">
                <button
                  type="button"
                  className="btn-primary"
                  onClick={handleVusAprobar}
                >
                  Documentos completos (pasar a Revisión VUS)
                </button>

                <button
                  type="button"
                  className="btn-danger"
                  onClick={handleVusRechazar}
                >
                  Devolver al solicitante
                </button>
              </div>
            </section>
          )}

          {/* Acciones del solicitante (reenvío / descarga) */}
          {esSolicitante && (
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
                    La solicitud fue rechazada o devuelta. Puedes adjuntar
                    nuevos documentos para corregirla.
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
          )}
        </div>
      </div>
    </div>
  );
}
