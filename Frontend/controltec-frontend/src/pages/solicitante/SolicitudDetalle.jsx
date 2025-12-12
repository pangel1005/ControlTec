// src/pages/solicitante/SolicitudDetalle.jsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api/apiClient";
import { useAuth } from "../../context/AuthContext";

import { useEffect as useEffectReact, useState as useStateReact } from "react";

function FormularioDigitalDetalle({ solicitudId }) {
  const [respuestas, setRespuestas] = useStateReact(null);
  const [estructura, setEstructura] = useStateReact(null);
  const [loading, setLoading] = useStateReact(true);
  const [error, setError] = useStateReact("");

  useEffectReact(() => {
    let cancelado = false;
    async function cargar() {
      setLoading(true);
      setError("");
      try {
        // 1. Obtener respuestas del formulario digital
        const respRes = await api.get(`/api/RespuestasFormulariosDigitales/solicitud/${solicitudId}`);
        if (!respRes.data) {
          setRespuestas(null);
          setEstructura(null);
          setLoading(false);
          return;
        }
        setRespuestas(respRes.data.respuestasJson ? JSON.parse(respRes.data.respuestasJson) : {});
        // 2. Obtener estructura del formulario digital
        if (respRes.data.formularioDigitalId) {
          const formRes = await api.get(`/api/FormulariosDigitales/${respRes.data.formularioDigitalId}`);
          setEstructura(formRes.data.estructuraJson ? JSON.parse(formRes.data.estructuraJson) : {});
        } else {
          setEstructura(null);
        }
      } catch (err) {
        setError("No se pudo cargar los datos del formulario digital.");
        setRespuestas(null);
        setEstructura(null);
      } finally {
        if (!cancelado) setLoading(false);
      }
    }
    cargar();
    return () => { cancelado = true; };
  }, [solicitudId]);

  if (loading) return <p>Cargando datos del formulario digital...</p>;
  if (error) return <p className="detalle-muted">{error}</p>;
  if (!estructura || !estructura.campos || estructura.campos.length === 0)
    return <p className="detalle-muted">No hay datos del formulario digital para esta solicitud.</p>;
  return (
    <ul className="detalle-form-list">
      {estructura.campos.map((campo, idx) => (
        <li key={campo.nombre || idx} style={{ marginBottom: 8 }}>
          <strong>{campo.etiqueta || campo.nombre}:</strong>{" "}
          {campo.tipo === "checkbox"
            ? (respuestas && respuestas[campo.nombre] ? "Sí" : "No")
            : (respuestas && respuestas[campo.nombre] !== undefined && respuestas[campo.nombre] !== null && respuestas[campo.nombre] !== "")
              ? respuestas[campo.nombre]
              : <span style={{ color: '#6b7280' }}>[Sin dato]</span>}
        </li>
      ))}
    </ul>
  );
}

export default function SolicitudDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { usuario } = useAuth();

  const [detalle, setDetalle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Archivos reenvío solicitante
  const [reuploadFiles, setReuploadFiles] = useState([]);

  // Comentarios por rol
  const [comentarioVus, setComentarioVus] = useState("");
  const [comentarioUpc, setComentarioUpc] = useState("");
  const [comentarioEncargado, setComentarioEncargado] = useState("");
  const [comentarioDncd, setComentarioDncd] = useState("");

  // Bloqueo de acciones (después de cambiar estado)
  const [accionesBloqueadas, setAccionesBloqueadas] = useState(false);

  const rol = (usuario?.roll || usuario?.Roll || "").trim();
  const esVus = rol === "VUS";
  const esSolicitante = rol === "Solicitante";
  const esTecnicoUPC = rol === "TecnicoUPC";
  const esEncargadoUPC = rol === "EncargadoUPC";
  const esDNCD = rol === "DNCD";
  const esDireccion = rol === "Direccion";

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
    if (e.includes("rechaz")) return "badge badge-danger";
    if (e.includes("devuelt")) return "badge badge-warning";
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

  const handleEnviarNuevosDocs = async () => {
    if (reuploadFiles.length === 0) {
      alert("Debes seleccionar al menos un documento.");
      return;
    }

    try {
      // 1. Subir los archivos
      for (const file of reuploadFiles) {
        const formData = new FormData();
        formData.append("archivo", file);
        await api.post(`/api/Solicitudes/${detalle.id}/documentos`, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
      }
      // 2. Cambiar estado llamando a /enviar
      await api.post(`/api/Solicitudes/${detalle.id}/enviar`, {
        comentario: "Documentos de Fase 2 enviados por el usuario."
      });
      setReuploadFiles([]);
      await cargarDetalle();
      alert("Documentos de Fase 2 enviados correctamente.");
    } catch (err) {
      console.error("Error al enviar documentos de Fase 2:", err);
      alert("No fue posible enviar los documentos de Fase 2. Intenta de nuevo.");
    }
  };

  // Estados lógicos
  const estadoLower = (detalle?.estado || "").toLowerCase();
  const esDevuelta = estadoLower.includes("devuelt");
  const esRechazada = estadoLower.includes("rechaz");
  const esAprobada = estadoLower.includes("aprob");
  const esEstadoAprobacionDNCD =
    estadoLower.includes("aprobación dncd") ||
    estadoLower.includes("aprobacion dncd");
  const tieneCertificado = !!detalle?.rutaCertificado;

  // =================== ACCIONES VUS ===================
  const handleVusAprobar = async () => {
    if (!detalle) return;

    const confirmado = window.confirm(
      "¿Confirmas que la solicitud tiene todos los documentos y puede pasar a la siguiente revisión?"
    );
    if (!confirmado) return;

    setAccionesBloqueadas(true);
    try {
      await api.post(`/api/Solicitudes/${detalle.id}/aprobar-fase1`, {});

      setComentarioVus("");
      await cargarDetalle();
      alert("Solicitud enviada a la siguiente revisión.");
    } catch (err) {
      console.error("Error al cambiar estado como VUS:", err);
      alert(
        "No fue posible actualizar el estado. Verifica que el backend permita esta transición para el rol VUS."
      );
      setAccionesBloqueadas(false);
    }
  };

  const handleVusRechazar = async () => {
    if (!detalle) return;

    if (!comentarioVus.trim()) {
      alert("Debes indicar el motivo de la devolución.");
      return;
    }

    const confirmado = window.confirm(
      "¿Confirmas que la solicitud será devuelta al solicitante?"
    );
    if (!confirmado) return;

    setAccionesBloqueadas(true);
    try {
      await api.post(`/api/Solicitudes/${detalle.id}/cambiar-estado`, {
        estadoNuevo: "Devuelta",
        comentario: comentarioVus,
      });

      setComentarioVus("");
      await cargarDetalle();
      alert("Solicitud devuelta al solicitante para corrección.");
    } catch (err) {
      console.error("Error al devolver como VUS:", err);
      alert(
        "No fue posible devolver la solicitud. Verifica que el backend permita esta transición para el rol VUS."
      );
      setAccionesBloqueadas(false);
    }
  };

  // =================== ACCIONES TÉCNICO UPC ===================
  const handleUpcAprobar = async () => {
    if (!detalle) return;

    const confirmado = window.confirm(
      "¿Confirmas que el expediente cumple con los requisitos y puede pasar a evaluación técnica detallada?"
    );
    if (!confirmado) return;

    setAccionesBloqueadas(true);
    try {
      await api.post(`/api/Solicitudes/${detalle.id}/cambiar-estado`, {
        estadoNuevo: "Evaluación Técnica",
        comentario:
          comentarioUpc ||
          "Expediente revisado por Técnico UPC. Pasa a evaluación técnica.",
      });

      setComentarioUpc("");
      await cargarDetalle();
      alert("Solicitud enviada a evaluación técnica.");
    } catch (err) {
      console.error("Error al cambiar estado como Técnico UPC:", err);
      alert(
        "No fue posible actualizar el estado. Verifica que el backend permita esta transición para el rol Técnico UPC."
      );
      setAccionesBloqueadas(false);
    }
  };

  const handleUpcDevolver = async () => {
    if (!detalle) return;

    if (!comentarioUpc.trim()) {
      alert("Debes indicar el motivo de la devolución.");
      return;
    }

    const confirmado = window.confirm(
      "¿Confirmas que la solicitud será devuelta al solicitante para subsanación?"
    );
    if (!confirmado) return;

    setAccionesBloqueadas(true);
    try {
      await api.post(`/api/Solicitudes/${detalle.id}/cambiar-estado`, {
        estadoNuevo: "Devuelta",
        comentario: comentarioUpc,
      });

      setComentarioUpc("");
      await cargarDetalle();
      alert("Solicitud devuelta al solicitante para corrección.");
    } catch (err) {
      console.error("Error al devolver como Técnico UPC:", err);
      alert(
        "No fue posible devolver la solicitud. Verifica que el backend permita esta transición para el rol Técnico UPC."
      );
      setAccionesBloqueadas(false);
    }
  };

  const handleUpcRechazar = async () => {
    if (!detalle) return;

    if (!comentarioUpc.trim()) {
      alert("Debes indicar el motivo del rechazo.");
      return;
    }

    const confirmado = window.confirm(
      "¿Confirmas que la solicitud será rechazada definitivamente?"
    );
    if (!confirmado) return;

    setAccionesBloqueadas(true);
    try {
      await api.post(`/api/Solicitudes/${detalle.id}/cambiar-estado`, {
        estadoNuevo: "RechazadaET",
        comentario: comentarioUpc,
      });

      setComentarioUpc("");
      await cargarDetalle();
      alert("Solicitud rechazada.");
    } catch (err) {
      console.error("Error al rechazar como Técnico UPC:", err);
      alert(
        "No fue posible rechazar la solicitud. Verifica que el backend permita esta transición para el rol Técnico UPC."
      );
      setAccionesBloqueadas(false);
    }
  };

  // =================== ACCIONES ENCARGADO UPC ===================
  const handleEncargadoRemitirDncd = async () => {
    if (!detalle) return;

    const confirmado = window.confirm(
      "¿Confirmas que deseas remitir esta solicitud a la DNCD para su revisión?"
    );
    if (!confirmado) return;

    setAccionesBloqueadas(true);
    try {
      await api.post(`/api/Solicitudes/${detalle.id}/cambiar-estado`, {
        estadoNuevo: "Aprobación DIGEAMPS",
        comentario:
          comentarioEncargado ||
          "Revisión técnica completada por Encargado UPC. Se remite a DNCD.",
      });

      setComentarioEncargado("");
      await cargarDetalle();
      alert("Solicitud remitida a la DNCD.");
    } catch (err) {
      console.error("Error al remitir desde Encargado UPC:", err);
      alert(
        "No fue posible remitir la solicitud. Verifica que el backend permita esta transición para el rol EncargadoUPC."
      );
      setAccionesBloqueadas(false);
    }
  };

  const handleEncargadoDevolverTecnico = async () => {
    if (!detalle) return;

    if (!comentarioEncargado.trim()) {
      alert("Debes indicar el motivo de la devolución al Técnico UPC.");
      return;
    }

    const confirmado = window.confirm(
      "¿Confirmas que deseas devolver la solicitud al Técnico UPC para ajustes?"
    );
    if (!confirmado) return;

    setAccionesBloqueadas(true);
    try {
      await api.post(`/api/Solicitudes/${detalle.id}/cambiar-estado`, {
        estadoNuevo: "Validación Recepción",
        comentario: comentarioEncargado,
      });

      setComentarioEncargado("");
      await cargarDetalle();
      alert("Solicitud devuelta al Técnico UPC para nueva revisión.");
    } catch (err) {
      console.error("Error al devolver al Técnico desde Encargado UPC:", err);
      alert(
        "No fue posible devolver la solicitud al Técnico UPC. Verifica que el backend permita esta transición para el rol EncargadoUPC."
      );
      setAccionesBloqueadas(false);
    }
  };

  // =================== ACCIONES DNCD ===================
  const handleDncdAprobar = async () => {
    if (!detalle) return;

    const confirmado = window.confirm(
      "¿Confirmas que deseas aprobar y firmar esta solicitud en la DNCD?"
    );
    if (!confirmado) return;

    setAccionesBloqueadas(true);
    try {
      await api.post(`/api/Solicitudes/${detalle.id}/cambiar-estado`, {
        estadoNuevo: "Aprobación DNCD",
        comentario:
          comentarioDncd ||
          "Solicitud aprobada por DNCD. Se remite a la Dirección para decisión final.",
      });

      setComentarioDncd("");
      await cargarDetalle();
      alert("Solicitud aprobada por DNCD.");
    } catch (err) {
      console.error("Error al aprobar como DNCD:", err);
      alert(
        "No fue posible aprobar la solicitud. Verifica que el backend permita esta transición para el rol DNCD."
      );
      setAccionesBloqueadas(false);
    }
  };

  const handleDncdDevolver = async () => {
    if (!detalle) return;

    if (!comentarioDncd.trim()) {
      alert("Debes indicar el motivo de la devolución.");
      return;
    }

    const confirmado = window.confirm(
      "¿Confirmas que deseas devolver la solicitud para corrección?"
    );
    if (!confirmado) return;

    setAccionesBloqueadas(true);
    try {
      await api.post(`/api/Solicitudes/${detalle.id}/cambiar-estado`, {
        estadoNuevo: "Devuelta",
        comentario: comentarioDncd,
      });

      setComentarioDncd("");
      await cargarDetalle();
      alert(
        "Solicitud devuelta para corrección. Volverá al flujo inicial para ser revisada."
      );
    } catch (err) {
      console.error("Error al devolver como DNCD:", err);
      alert(
        "No fue posible devolver la solicitud. Verifica que el backend permita esta transición para el rol DNCD."
      );
      setAccionesBloqueadas(false);
    }
  };

  const handleDncdRechazar = async () => {
    if (!detalle) return;

    if (!comentarioDncd.trim()) {
      alert("Debes indicar el motivo del rechazo.");
      return;
    }

    const confirmado = window.confirm(
      "¿Confirmas que deseas rechazar definitivamente la solicitud desde DNCD?"
    );
    if (!confirmado) return;

    setAccionesBloqueadas(true);
    try {
      await api.post(`/api/Solicitudes/${detalle.id}/cambiar-estado`, {
        estadoNuevo: "Rechazada",
        comentario: comentarioDncd,
      });

      setComentarioDncd("");
      await cargarDetalle();
      alert("Solicitud rechazada definitivamente por DNCD.");
    } catch (err) {
      console.error("Error al rechazar como DNCD:", err);
      alert(
        "No fue posible rechazar la solicitud. Verifica que el backend permita esta transición para el rol DNCD."
      );
      setAccionesBloqueadas(false);
    }
  };

  // =================== ACCIONES DIRECCIÓN (simple) ===================
  const handleDireccionAprobar = async () => {
    if (!detalle) return;

    const confirmado = window.confirm(
      "¿Confirmas que deseas aprobar y firmar esta solicitud de forma definitiva?"
    );
    if (!confirmado) return;

    setAccionesBloqueadas(true);
    try {
      await api.post(`/api/Solicitudes/${detalle.id}/cambiar-estado`, {
        estadoNuevo: "Aprobada",
        comentario: "Solicitud aprobada y firmada por Dirección.",
      });

      // Generar el certificado automáticamente
      await api.post(`/api/Solicitudes/${detalle.id}/certificado`, {});
      await cargarDetalle();
      alert(
        "Solicitud aprobada y certificado generado. Puedes descargarlo desde el botón correspondiente."
      );
    } catch (err) {
      console.error("Error al aprobar como Dirección:", err);
      alert(
        "No fue posible aprobar la solicitud. Verifica que el backend permita esta transición para el rol Dirección."
      );
      setAccionesBloqueadas(false);
    }
  };

  const handleVerCertificado = () => {
    if (!detalle?.rutaCertificado) {
      alert("Aún no se ha generado el certificado para esta solicitud.");
      return;
    }
    const base = api.defaults.baseURL || "";
    window.open(`${base}${detalle.rutaCertificado}`, "_blank");
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
          onClick={() => navigate("/login")}
        >
          Volver
        </button>
      </div>
    );
  }

  const documentosCargados = detalle.documentosCargados || [];
  const documentosRequeridos = detalle.documentosRequeridos || [];
  const historial = detalle.historial || [];

  let backPath = "/login";
  if (esSolicitante) backPath = "/mis-solicitudes";
  else if (esVus) backPath = "/vus/solicitudes";
  else if (esTecnicoUPC) backPath = "/upc/solicitudes";
  else if (esEncargadoUPC) backPath = "/encargado-upc/solicitudes";
  else if (esDNCD) backPath = "/dncd/solicitudes";
  else if (esDireccion) backPath = "/direccion/solicitudes";

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
            {/* Indicador de fase */}
            <div style={{ marginTop: 8 }}>
              <span style={{
                background: '#e0e7ff',
                color: '#3730a3',
                borderRadius: 6,
                padding: '2px 10px',
                fontWeight: 600,
                fontSize: 14,
              }}>
                Fase actual: {detalle.estado}
              </span>
              {detalle.estado === "PendienteFase2" && (
                <span style={{
                  background: '#bbf7d0',
                  color: '#166534',
                  borderRadius: 6,
                  padding: '2px 10px',
                  fontWeight: 600,
                  fontSize: 14,
                  marginLeft: 12,
                }}>
                  Puedes subir y enviar documentos de Fase 2
                </span>
              )}
              {detalle.estado !== "PendienteFase2" && detalle.estado !== "Fase1Aprobada" && detalle.estado !== "DepositadaFase2" && (
                <span style={{
                  background: '#fee2e2',
                  color: '#991b1b',
                  borderRadius: 6,
                  padding: '2px 10px',
                  fontWeight: 600,
                  fontSize: 14,
                  marginLeft: 12,
                }}>
                  Solo podrás subir documentos cuando la solicitud esté en Fase 2
                </span>
              )}
            </div>
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
              {detalle.servicio?.descripcion ?? "Este servicio no tiene descripción registrada."}
            </p>
          </section>

          {/* Detalles del formulario digital */}
          <section className="detalle-section">
            <h2 className="detalle-section-title">Detalles del formulario digital</h2>
            <FormularioDigitalDetalle solicitudId={detalle.id} />
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

          {/* Panel VUS */}
          {esVus && (
            <section className="detalle-section detalle-full-width">
              <h2 className="detalle-section-title">Revisión VUS</h2>

              <p>
                Verifica que todos los documentos requeridos estén cargados. Si están
                completos, puedes enviar la solicitud a la siguiente revisión. Si faltan
                documentos, devuélvela al solicitante indicando el motivo.
              </p>

              <textarea
                className="detalle-textarea"
                placeholder="Comentario para el solicitante (motivo de la devolución u observaciones)..."
                value={comentarioVus}
                onChange={(e) => setComentarioVus(e.target.value)}
              />

              <div className="detalle-actions">
                {detalle.estado === "DepositadaFase2" ? (
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={async () => {
                      setAccionesBloqueadas(true);
                      try {
                        await api.post(`/api/Solicitudes/${detalle.id}/aprobar-fase2`, {});
                        setComentarioVus("");
                        await cargarDetalle();
                        alert("Fase 2 aprobada. El flujo continúa con el Técnico UPC.");
                      } catch (err) {
                        console.error("Error al aprobar Fase 2 como VUS:", err);
                        alert("No fue posible aprobar Fase 2. Verifica que el backend permita esta transición.");
                        setAccionesBloqueadas(false);
                      }
                    }}
                    disabled={accionesBloqueadas}
                  >
                    Aprobar Fase 2
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={handleVusAprobar}
                    disabled={accionesBloqueadas}
                  >
                    Aprobar Fase 1
                  </button>
                )}

                <button
                  type="button"
                  className="btn-warning"
                  onClick={handleVusRechazar}
                  disabled={accionesBloqueadas}
                >
                  Devolver al solicitante para corrección
                </button>
              </div>
            </section>
)}

          {/* Panel Técnico UPC */}
          {esTecnicoUPC && (
            <section className="detalle-section detalle-full-width">
              <h2 className="detalle-section-title">Revisión Técnico UPC</h2>
              <p>
                Revisa el expediente recibido. Si cumple con los requisitos,
                envíalo a evaluación técnica detallada. Si hay observaciones,
                puedes devolverlo al solicitante o rechazarlo.
              </p>

              <textarea
                className="detalle-textarea"
                placeholder="Comentario para el comunicado de rechazo (Dirección lo firmará y lo enviará al usuario)..."
                value={comentarioUpc}
                onChange={(e) => setComentarioUpc(e.target.value)}
              />

              <div className="detalle-actions">
                <button
                  type="button"
                  className="btn-primary"
                  onClick={handleUpcAprobar}
                  disabled={accionesBloqueadas}
                >
                  Enviar a evaluación técnica
                </button>

                <button
                  type="button"
                  className="btn-warning"
                  onClick={handleUpcDevolver}
                  disabled={accionesBloqueadas}
                >
                  Devolver al solicitante para corrección
                </button>

                <button
                  type="button"
                  className="btn-danger"
                  title="Este rechazo enviará la solicitud a Dirección para que firmen y comuniquen el rechazo al usuario."
                  onClick={handleUpcRechazar}
                  disabled={accionesBloqueadas}
                >
                  Rechazar y enviar a Dirección para comunicado
                </button>
              </div>
            </section>
          )}

          {/* Panel Encargado UPC */}
          {esEncargadoUPC && (
            <section className="detalle-section detalle-full-width">
              <h2 className="detalle-section-title">Revisión Encargado UPC</h2>
              <p>
                Revisa el expediente evaluado. Si todo está conforme, remite la
                solicitud a la DNCD. Si consideras que deben hacerse ajustes,
                devuélvela al Técnico UPC con tus observaciones.
              </p>

              <textarea
                className="detalle-textarea"
                placeholder="Comentario para DNCD o para el Técnico UPC (motivo de devolución, observaciones técnicas, etc.)..."
                value={comentarioEncargado}
                onChange={(e) => setComentarioEncargado(e.target.value)}
              />

              <div className="detalle-actions">
                <button
                  type="button"
                  className="btn-primary"
                  onClick={handleEncargadoRemitirDncd}
                  disabled={accionesBloqueadas}
                >
                  Remitir a DNCD
                </button>

                <button
                  type="button"
                  className="btn-warning"
                  onClick={handleEncargadoDevolverTecnico}
                  disabled={accionesBloqueadas}
                >
                  Devolver al Técnico UPC para ajustes
                </button>
              </div>
            </section>
          )}

          {/* Panel DNCD */}
          {esDNCD && (
            <section className="detalle-section detalle-full-width">
              <h2 className="detalle-section-title">Revisión DNCD</h2>
              <p>
                Revisa las solicitudes remitidas desde la Unidad de Productos
                Controlados. Si todo está conforme, apruébalas y fírmales tu
                conformidad. También puedes devolverlas para corrección.
              </p>

              <textarea
                className="detalle-textarea"
                placeholder="Comentario para Dirección o para el solicitante (motivo de devolución, observaciones)..."
                value={comentarioDncd}
                onChange={(e) => setComentarioDncd(e.target.value)}
              />

              <div className="detalle-actions">
                <button
                  type="button"
                  className="btn-primary"
                  onClick={handleDncdAprobar}
                  disabled={accionesBloqueadas}
                >
                  Aprobar y firmar
                </button>

                <button
                  type="button"
                  className="btn-warning"
                  onClick={handleDncdDevolver}
                  disabled={accionesBloqueadas}
                >
                  Devolver para corrección
                </button>
              </div>
            </section>
          )}

          {/* Panel Dirección (simple) */}
          {esDireccion && (
            <section className="detalle-section detalle-full-width">
              <h2 className="detalle-section-title">
                Revisión Dirección de Productos Controlados
              </h2>
              <p>
                Desde Dirección puedes revisar las solicitudes que ya cuentan
                con la aprobación de la DNCD y decidir si se aprueban de forma
                definitiva. Al aprobar y firmar, se habilita la posibilidad de
                generar y consultar el certificado final.
              </p>

              {esEstadoAprobacionDNCD ? (
                <button
                  type="button"
                  className="btn-primary btn-full"
                  onClick={handleDireccionAprobar}
                  disabled={accionesBloqueadas}
                >
                  Aprobar y firmar
                </button>
              ) : detalle.estado === "RechazadaET" ? (
                <>
                  <button
                    type="button"
                    className="btn-primary btn-full"
                    onClick={async () => {
                      setAccionesBloqueadas(true);
                      try {
                        await api.post(`/api/Solicitudes/${detalle.id}/comunicacion-rechazo`, {});
                        await cargarDetalle();
                        alert("Comunicado de rechazo generado y firmado. El usuario ya puede verlo.");
                      } catch (err) {
                        alert("No fue posible generar el comunicado de rechazo. Verifica permisos y estado actual.");
                        setAccionesBloqueadas(false);
                      }
                    }}
                    disabled={accionesBloqueadas}
                    style={{ marginBottom: 8 }}
                  >
                    Firmar y generar comunicado de rechazo
                  </button>
                  {detalle.rutaComunicacionRechazo && (
                    <>
                      <button
                        type="button"
                        className="btn-secondary btn-full"
                        onClick={() => {
                          const base = api.defaults.baseURL || "";
                          window.open(`${base}${detalle.rutaComunicacionRechazo}`, "_blank");
                        }}
                      >
                        Ver comunicado de rechazo
                      </button>
                      <button
                        type="button"
                        className="btn-primary btn-full"
                        style={{ marginTop: 8 }}
                        onClick={() => {
                          const base = api.defaults.baseURL || "";
                          const link = document.createElement('a');
                          link.href = `${base}${detalle.rutaComunicacionRechazo}`;
                          link.download = `Notificacion_Rechazo_Solicitud_${detalle.id}.pdf`;
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                        }}
                      >
                        Descargar notificación de rechazo
                      </button>
                    </>
                  )}
                </>
              ) : (
                <p className="detalle-muted">
                  No hay acciones disponibles para esta solicitud en este
                  momento.
                </p>
              )}

              {tieneCertificado && (
                <div style={{ marginTop: "0.75rem" }}>
                  <button
                    type="button"
                    className="btn-secondary btn-full"
                    onClick={handleVerCertificado}
                  >
                    Ver certificado
                  </button>
                </div>
              )}
            </section>
          )}

          {esSolicitante && (
            <section className="detalle-section detalle-full-width">
              <h2 className="detalle-section-title">Acciones</h2>

              {detalle.rutaCertificado && (
                <button
                  type="button"
                  className="btn-primary"
                  onClick={handleVerCertificado}
                >
                  Ver certificado
                </button>
              )}

              {detalle.rutaComunicacionRechazo && (
                <>
                  <button
                    type="button"
                    className="btn-danger"
                    onClick={() => {
                      const base = api.defaults.baseURL || "";
                      window.open(`${base}${detalle.rutaComunicacionRechazo}`, "_blank");
                    }}
                  >
                    Ver comunicado de rechazo
                  </button>
                  <button
                    type="button"
                    className="btn-secondary"
                    style={{ marginLeft: 8 }}
                    onClick={() => {
                      const base = api.defaults.baseURL || "";
                      // Forzar descarga en vez de solo abrir
                      const link = document.createElement('a');
                      link.href = `${base}${detalle.rutaComunicacionRechazo}`;
                      link.download = `Notificacion_Rechazo_Solicitud_${detalle.id}.pdf`;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }}
                  >
                    Descargar notificación de rechazo
                  </button>
                </>
              )}

              {/* SOLO permitir subir archivos cuando está DEVUELTA, no RECHAZADA */}
              {esDevuelta && (
                <div className="detalle-reupload">
                  <p className="detalle-muted">
                    La solicitud fue devuelta. Puedes adjuntar nuevos documentos
                    para corregirla y reenviarla.
                  </p>
                  <input
                    type="file"
                    multiple
                    onChange={handleReuploadChange}
                  />
                  {reuploadFiles.length > 0 && (
                    <ul className="detalle-list">
                      {reuploadFiles.map((f, i) => (
                        <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          {f.name}
                          <button
                            type="button"
                            aria-label="Eliminar archivo"
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#ef4444',
                              cursor: 'pointer',
                              fontSize: 18,
                              padding: 0,
                            }}
                            onClick={() => setReuploadFiles(prev => prev.filter((_, idx) => idx !== i))}
                          >
                            ×
                          </button>
                        </li>
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

              {/* Permitir subir documentos de Fase 2 solo cuando el estado es PendienteFase2 */}
              {detalle.estado === "PendienteFase2" && (
                <div className="detalle-reupload">
                  <p className="detalle-muted">
                    Adjunta los documentos requeridos para la Fase 2 y envíalos para validación del VUS.
                  </p>
                  <input
                    type="file"
                    multiple
                    onChange={handleReuploadChange}
                  />
                  {reuploadFiles.length > 0 && (
                    <ul className="detalle-list">
                      {reuploadFiles.map((f, i) => (
                        <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          {f.name}
                          <button
                            type="button"
                            aria-label="Eliminar archivo"
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#ef4444',
                              cursor: 'pointer',
                              fontSize: 18,
                              padding: 0,
                            }}
                            onClick={() => setReuploadFiles(prev => prev.filter((_, idx) => idx !== i))}
                          >
                            ×
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={handleEnviarNuevosDocs}
                  >
                    Enviar documentos de Fase 2
                  </button>
                </div>
              )}

              {esRechazada && (
                <p className="detalle-muted">
                  La solicitud fue rechazada de forma definitiva. No es posible
                  adjuntar nuevos documentos para esta solicitud.
                </p>
              )}

              {!esAprobada && !esDevuelta && !esRechazada && (
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
