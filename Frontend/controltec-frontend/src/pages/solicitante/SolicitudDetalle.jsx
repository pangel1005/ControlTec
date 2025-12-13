// src/pages/solicitante/SolicitudDetalle.jsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api/apiClient";
import { useAuth } from "../../context/AuthContext";

import "./SolicitudDetalle.css";


function FormularioDigitalDetalle({ solicitudId }) {
  const [respuestas, setRespuestas] = useState(null);
  const [estructura, setEstructura] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelado = false;

    async function cargar() {
      setLoading(true);
      setError("");

      try {
        // 1) Obtener respuestas del formulario digital
        const respRes = await api.get(
          `/api/RespuestasFormulariosDigitales/solicitud/${solicitudId}`
        );

        if (!respRes.data) {
          if (!cancelado) {
            setRespuestas(null);
            setEstructura(null);
          }
          return;
        }

        const respJson = respRes.data.respuestasJson
          ? JSON.parse(respRes.data.respuestasJson)
          : {};

        if (!cancelado) setRespuestas(respJson);

        // 2) Obtener estructura del formulario digital
        if (respRes.data.formularioDigitalId) {
          const formRes = await api.get(
            `/api/FormulariosDigitales/${respRes.data.formularioDigitalId}`
          );
          const estructuraJson = formRes.data?.estructuraJson
            ? JSON.parse(formRes.data.estructuraJson)
            : {};
          if (!cancelado) setEstructura(estructuraJson);
        } else {
          if (!cancelado) setEstructura(null);
        }
      } catch (err) {
        console.error(err);
        if (!cancelado) {
          setError("No se pudo cargar los datos del formulario digital.");
          setRespuestas(null);
          setEstructura(null);
        }
      } finally {
        if (!cancelado) setLoading(false);
      }
    }

    cargar();
    return () => {
      cancelado = true;
    };
  }, [solicitudId]);

  if (loading) return <p className="sd-card-note">Cargando datos del formulario digital...</p>;
  if (error) return <p className="sd-card-note">{error}</p>;

  const campos = estructura?.campos || [];
  if (!estructura || !Array.isArray(campos) || campos.length === 0) {
    return (
      <p className="sd-card-note">
        No hay datos del formulario digital para esta solicitud.
      </p>
    );
  }

  return (
    <div className="sd-info-grid">
      {campos.map((campo, idx) => {
        const key = campo?.nombre || idx;
        const label = campo?.etiqueta || campo?.nombre || `Campo ${idx + 1}`;

        const valor =
          campo?.tipo === "checkbox"
            ? respuestas && respuestas[campo.nombre]
              ? "Sí"
              : "No"
            : respuestas &&
              respuestas[campo.nombre] !== undefined &&
              respuestas[campo.nombre] !== null &&
              respuestas[campo.nombre] !== ""
            ? respuestas[campo.nombre]
            : null;

        return (
          <dl key={key} className="sd-kv">
            <dt>{label}:</dt>
            <dd>{valor ?? <span style={{ color: "#6b7280" }}>[Sin dato]</span>}</dd>
          </dl>
        );
      })}
    </div>
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

  const getEstadoBadgeClass = (estado = "") => {
    const e = (estado || "").toLowerCase();
    if (e.includes("rechaz")) return "sd-badge sd-badge--red";
    if (e.includes("devuelt")) return "sd-badge sd-badge--yellow";
    if (e.includes("aprob")) return "sd-badge sd-badge--green";
    if (e.includes("deposit")) return "sd-badge sd-badge--blue";
    if (e.includes("pend")) return "sd-badge sd-badge--yellow";
    return "sd-badge sd-badge--blue";
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
      // 1) Subir los archivos
      for (const file of reuploadFiles) {
        const formData = new FormData();
        formData.append("archivo", file);
        await api.post(`/api/Solicitudes/${detalle.id}/documentos`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      // 2) Cambiar estado llamando a /enviar
      await api.post(`/api/Solicitudes/${detalle.id}/enviar`, {
        comentario: "Documentos de Fase 2 enviados por el usuario.",
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
    estadoLower.includes("aprobación dncd") || estadoLower.includes("aprobacion dncd");
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

    const confirmado = window.confirm("¿Confirmas que la solicitud será devuelta al solicitante?");
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
          comentarioUpc || "Expediente revisado por Técnico UPC. Pasa a evaluación técnica.",
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

    const confirmado = window.confirm("¿Confirmas que la solicitud será rechazada definitivamente?");
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

    const confirmado = window.confirm("¿Confirmas que deseas devolver la solicitud para corrección?");
    if (!confirmado) return;

    setAccionesBloqueadas(true);
    try {
      await api.post(`/api/Solicitudes/${detalle.id}/cambiar-estado`, {
        estadoNuevo: "Devuelta",
        comentario: comentarioDncd,
      });

      setComentarioDncd("");
      await cargarDetalle();
      alert("Solicitud devuelta para corrección. Volverá al flujo inicial para ser revisada.");
    } catch (err) {
      console.error("Error al devolver como DNCD:", err);
      alert(
        "No fue posible devolver la solicitud. Verifica que el backend permita esta transición para el rol DNCD."
      );
      setAccionesBloqueadas(false);
    }
  };

  // =================== ACCIONES DIRECCIÓN ===================
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

      await api.post(`/api/Solicitudes/${detalle.id}/certificado`, {});
      await cargarDetalle();
      alert("Solicitud aprobada y certificado generado. Puedes descargarlo desde el botón correspondiente.");
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
      <div className="sd-page">
        <div className="sd-container">
          <p className="sd-card-note">Cargando detalle de la solicitud...</p>
        </div>
      </div>
    );
  }

  if (error || !detalle) {
    return (
      <div className="sd-page">
        <div className="sd-container">
          <div className="sd-alert sd-alert--danger">
            {error || "No se pudo cargar el detalle de la solicitud."}
          </div>
          <button type="button" className="sd-btn sd-btn-outline" onClick={() => navigate("/login")}>
            Volver
          </button>
        </div>
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

  const servicioNombre = detalle.servicio?.nombre ?? "Sin servicio asociado";

  return (
    <div className="sd-page">
      <div className="sd-container">
        <button
          type="button"
          className="sd-btn sd-btn-outline"
          onClick={() => navigate(backPath)}
          style={{ marginBottom: 12 }}
        >
          ← Volver
        </button>

        {/* HEADER */}
        <div className="sd-header">
          <div className="sd-title-wrap">
            <h1 className="sd-title">Solicitud #{detalle.id}</h1>
            <p className="sd-subtitle">Servicio: {servicioNombre}</p>
          </div>

          <div className="sd-header-right">
            <span className={getEstadoBadgeClass(detalle.estado)}>{detalle.estado}</span>
          </div>
        </div>

        {/* ALERTS FASE */}
        {detalle.estado === "PendienteFase2" && (
          <div className="sd-alert sd-alert--info">
            <strong>Fase actual:</strong> {detalle.estado} — Puedes subir y enviar documentos de Fase 2.
          </div>
        )}

        {detalle.estado !== "PendienteFase2" &&
          detalle.estado !== "Fase1Aprobada" &&
          detalle.estado !== "DepositadaFase2" && (
            <div className="sd-alert sd-alert--warn">
              <strong>Fase actual:</strong> {detalle.estado} — Solo podrás subir documentos cuando la solicitud esté en Fase 2.
            </div>
          )}

        {/* LAYOUT PRINCIPAL */}
        <div className="sd-layout">
          {/* COLUMNA IZQUIERDA */}
          <div className="sd-col">
            {/* INFO GENERAL */}
            <section className="sd-card">
              <div className="sd-card-head">
                <h2 className="sd-card-title">Información general</h2>
              </div>
              <div className="sd-card-body">
                <div className="sd-info-grid">
                  <dl className="sd-kv">
                    <dt>Fecha de creación:</dt>
                    <dd>{formatFecha(detalle.fechaCreacion)}</dd>
                  </dl>

                  <dl className="sd-kv">
                    <dt>Usuario:</dt>
                    <dd>
                      {detalle.usuario?.nombre ?? "-"} ({detalle.usuario?.correo ?? "-"})
                    </dd>
                  </dl>

                  <dl className="sd-kv">
                    <dt>Descripción:</dt>
                    <dd>{detalle.servicio?.descripcion ?? "Este servicio no tiene descripción registrada."}</dd>
                  </dl>
                </div>
              </div>
            </section>

            {/* DOCUMENTOS REQUERIDOS */}
            <section className="sd-card">
              <div className="sd-card-head">
                <h2 className="sd-card-title">Documentos requeridos</h2>
              </div>
              <div className="sd-card-body">
                {documentosRequeridos.length === 0 ? (
                  <p className="sd-card-note">Este servicio aún no tiene requerimientos configurados.</p>
                ) : (
                  <ul className="sd-list sd-list--checks">
                    {documentosRequeridos.map((req) => (
                      <li key={req.id}>{req.nombre}</li>
                    ))}
                  </ul>
                )}
              </div>
            </section>

            {/* HISTORIAL */}
            <section className="sd-card">
              <div className="sd-card-head">
                <h2 className="sd-card-title">Historial de estados</h2>
              </div>
              <div className="sd-card-body">
                {historial.length === 0 ? (
                  <p className="sd-card-note">Aún no hay movimientos registrados para esta solicitud.</p>
                ) : (
                  <ul className="sd-timeline">
                    {historial.map((h, idx) => (
                      <li key={h.id ?? `${h.fechaCambio}-${idx}`} className="sd-tl-item">
                        <div className="sd-tl-top">
                          <span className="sd-tl-state">
                            {h.estadoAnterior ? `${h.estadoAnterior} → ${h.estadoNuevo}` : h.estadoNuevo}
                          </span>
                          <span className="sd-tl-date">{formatFecha(h.fechaCambio)}</span>
                        </div>

                        <p className="sd-tl-note">
                          {h.usuario ? (
                            <>
                              — por <strong>{h.usuario.nombre}</strong> ({h.usuario.roll})
                            </>
                          ) : null}
                          {h.comentario ? <> — "{h.comentario}"</> : null}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>
          </div>

          {/* COLUMNA DERECHA */}
          <div className="sd-col">
            {/* FORMULARIO DIGITAL */}
            <section className="sd-card">
              <div className="sd-card-head">
                <h2 className="sd-card-title">Detalles del formulario digital</h2>
              </div>
              <div className="sd-card-body">
                <FormularioDigitalDetalle solicitudId={detalle.id} />
              </div>
            </section>

            {/* DOCUMENTOS CARGADOS */}
            <section className="sd-card">
              <div className="sd-card-head">
                <h2 className="sd-card-title">Documentos cargados</h2>
              </div>
              <div className="sd-card-body">
                {documentosCargados.length === 0 ? (
                  <p className="sd-card-note">Todavía no se han cargado documentos para esta solicitud.</p>
                ) : (
                  <div className="sd-docs">
                    {documentosCargados.map((doc) => (
                      <div key={doc.id} className="sd-doc-row">
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div className="sd-doc-name">{doc.nombre}</div>
                          <div className="sd-doc-meta">{doc.tipo || "application/pdf"}</div>
                        </div>
                        <button
                          type="button"
                          className="sd-btn sd-btn-outline"
                          onClick={() => handleDescargarDocumento(doc.id)}
                        >
                          Descargar
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>

        {/* =================== ACCIONES (FULL WIDTH) =================== */}
        <div style={{ marginTop: "1rem" }}>
          {/* Panel VUS */}
          {esVus && (
            <section className="sd-card">
              <div className="sd-card-head">
                <h2 className="sd-card-title">Revisión VUS</h2>
              </div>

              <div className="sd-card-body">
                <p className="sd-actions-help">
                  Verifica que todos los documentos requeridos estén cargados. Si están completos, aprueba.
                  Si faltan documentos, devuélvela al solicitante indicando el motivo.
                </p>

                <textarea
                  placeholder="Comentario para el solicitante (motivo de la devolución u observaciones)..."
                  value={comentarioVus}
                  onChange={(e) => setComentarioVus(e.target.value)}
                  style={{
                    width: "100%",
                    minHeight: 110,
                    marginTop: 10,
                    padding: "0.8rem 0.9rem",
                    borderRadius: 12,
                    border: "1px solid #e5e7eb",
                    outline: "none",
                  }}
                />

                <div className="sd-actions" style={{ marginTop: 12 }}>
                  <div className="sd-actions-row">
                    {/* Botón verde para servicios con fases */}
                    {detalle.estado === "DepositadaFase2" &&
                    (detalle.servicio?.id === 4 || detalle.servicio?.id === 5) ? (
                      <button
                        type="button"
                        className="sd-btn sd-btn-primary"
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
                    ) : detalle.estado === "DepositadaFase2" &&
                      detalle.servicio?.id !== 4 &&
                      detalle.servicio?.id !== 5 ? (
                      <button
                        type="button"
                        className="sd-btn sd-btn-primary"
                        onClick={async () => {
                          setAccionesBloqueadas(true);
                          try {
                            await api.post(`/api/Solicitudes/${detalle.id}/aprobar-fase2`, {});
                            setComentarioVus("");
                            await cargarDetalle();
                            alert("Fase 2 aprobada. La solicitud pasa a Validación Recepción.");
                          } catch (err) {
                            console.error("Error al aprobar Fase 2 como VUS:", err);
                            alert("No fue posible aprobar Fase 2. Verifica que el backend permita esta transición.");
                            setAccionesBloqueadas(false);
                          }
                        }}
                        disabled={accionesBloqueadas}
                      >
                        Aprobar y pasar a Validación Recepción
                      </button>
                    ) : detalle.estado === "Depositada" && detalle.servicio?.id === 1 ? (
                      <button
                        type="button"
                        className="sd-btn sd-btn-primary"
                        onClick={async () => {
                          setAccionesBloqueadas(true);
                          try {
                            await api.post(`/api/Solicitudes/${detalle.id}/cambiar-estado`, {
                              estadoNuevo: "Validación Recepción",
                              comentario: comentarioVus,
                            });
                            setComentarioVus("");
                            await cargarDetalle();
                            alert("Solicitud aprobada y enviada a Validación Recepción.");
                          } catch (err) {
                            console.error("Error al aprobar solicitud como VUS:", err);
                            alert("No fue posible aprobar la solicitud. Verifica que el backend permita esta transición.");
                            setAccionesBloqueadas(false);
                          }
                        }}
                        disabled={accionesBloqueadas}
                      >
                        Aprobar solicitud
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="sd-btn sd-btn-primary"
                        onClick={handleVusAprobar}
                        disabled={accionesBloqueadas}
                      >
                        Aprobar Fase 1
                      </button>
                    )}

                    <button
                      type="button"
                      className="sd-btn sd-btn-outline"
                      onClick={handleVusRechazar}
                      disabled={accionesBloqueadas}
                    >
                      Devolver al solicitante
                    </button>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Panel Técnico UPC */}
          {esTecnicoUPC && (
            <section className="sd-card">
              <div className="sd-card-head">
                <h2 className="sd-card-title">Revisión Técnico UPC</h2>
              </div>

              <div className="sd-card-body">
                <p className="sd-actions-help">
                  Revisa el expediente recibido. Si cumple con los requisitos, envíalo a evaluación técnica.
                  Si hay observaciones, puedes devolverlo al solicitante o rechazarlo.
                </p>

                <textarea
                  placeholder="Comentario para el comunicado de rechazo (Dirección lo firmará y lo enviará al usuario)..."
                  value={comentarioUpc}
                  onChange={(e) => setComentarioUpc(e.target.value)}
                  style={{
                    width: "100%",
                    minHeight: 110,
                    marginTop: 10,
                    padding: "0.8rem 0.9rem",
                    borderRadius: 12,
                    border: "1px solid #e5e7eb",
                    outline: "none",
                  }}
                />

                <div className="sd-actions" style={{ marginTop: 12 }}>
                  <div className="sd-actions-row">
                    <button
                      type="button"
                      className="sd-btn sd-btn-primary"
                      onClick={handleUpcAprobar}
                      disabled={accionesBloqueadas}
                    >
                      Enviar a evaluación técnica
                    </button>

                    <button
                      type="button"
                      className="sd-btn sd-btn-outline"
                      onClick={handleUpcDevolver}
                      disabled={accionesBloqueadas}
                    >
                      Devolver al solicitante
                    </button>

                    <button
                      type="button"
                      className="sd-btn sd-btn-danger"
                      title="Este rechazo enviará la solicitud a Dirección para que firmen y comuniquen el rechazo al usuario."
                      onClick={handleUpcRechazar}
                      disabled={accionesBloqueadas}
                    >
                      Rechazar y enviar a Dirección
                    </button>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Panel Encargado UPC */}
          {esEncargadoUPC && (
            <section className="sd-card">
              <div className="sd-card-head">
                <h2 className="sd-card-title">Revisión Encargado UPC</h2>
              </div>

              <div className="sd-card-body">
                <p className="sd-actions-help">
                  Revisa el expediente evaluado. Si todo está conforme, remite la solicitud a la DNCD.
                  Si deben hacerse ajustes, devuélvela al Técnico UPC con tus observaciones.
                </p>

                <textarea
                  placeholder="Comentario para DNCD o para el Técnico UPC (motivo de devolución, observaciones técnicas, etc.)..."
                  value={comentarioEncargado}
                  onChange={(e) => setComentarioEncargado(e.target.value)}
                  style={{
                    width: "100%",
                    minHeight: 110,
                    marginTop: 10,
                    padding: "0.8rem 0.9rem",
                    borderRadius: 12,
                    border: "1px solid #e5e7eb",
                    outline: "none",
                  }}
                />

                <div className="sd-actions" style={{ marginTop: 12 }}>
                  <div className="sd-actions-row">
                    <button
                      type="button"
                      className="sd-btn sd-btn-primary"
                      onClick={handleEncargadoRemitirDncd}
                      disabled={accionesBloqueadas}
                    >
                      Remitir a DNCD
                    </button>

                    <button
                      type="button"
                      className="sd-btn sd-btn-outline"
                      onClick={handleEncargadoDevolverTecnico}
                      disabled={accionesBloqueadas}
                    >
                      Devolver al Técnico UPC
                    </button>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Panel DNCD */}
          {esDNCD && (
            <section className="sd-card">
              <div className="sd-card-head">
                <h2 className="sd-card-title">Revisión DNCD</h2>
              </div>

              <div className="sd-card-body">
                <p className="sd-actions-help">
                  Revisa las solicitudes remitidas desde la UPC. Si todo está conforme, apruébalas.
                  También puedes devolverlas para corrección.
                </p>

                <textarea
                  placeholder="Comentario para Dirección o para el solicitante (motivo de devolución, observaciones)..."
                  value={comentarioDncd}
                  onChange={(e) => setComentarioDncd(e.target.value)}
                  style={{
                    width: "100%",
                    minHeight: 110,
                    marginTop: 10,
                    padding: "0.8rem 0.9rem",
                    borderRadius: 12,
                    border: "1px solid #e5e7eb",
                    outline: "none",
                  }}
                />

                <div className="sd-actions" style={{ marginTop: 12 }}>
                  <div className="sd-actions-row">
                    <button
                      type="button"
                      className="sd-btn sd-btn-primary"
                      onClick={handleDncdAprobar}
                      disabled={accionesBloqueadas}
                    >
                      Aprobar y firmar
                    </button>

                    <button
                      type="button"
                      className="sd-btn sd-btn-outline"
                      onClick={handleDncdDevolver}
                      disabled={accionesBloqueadas}
                    >
                      Devolver para corrección
                    </button>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Panel Dirección */}
          {esDireccion && (
            <section className="sd-card">
              <div className="sd-card-head">
                <h2 className="sd-card-title">Revisión Dirección de Productos Controlados</h2>
              </div>

              <div className="sd-card-body">
                <p className="sd-actions-help">
                  Desde Dirección puedes revisar solicitudes con aprobación DNCD y decidir si se aprueban
                  de forma definitiva. Al aprobar, se genera el certificado final.
                </p>

                {esEstadoAprobacionDNCD ? (
                  <button
                    type="button"
                    className="sd-btn sd-btn-primary"
                    onClick={handleDireccionAprobar}
                    disabled={accionesBloqueadas}
                    style={{ width: "100%" }}
                  >
                    Aprobar y firmar
                  </button>
                ) : detalle.estado === "RechazadaET" ? (
                  <>
                    <button
                      type="button"
                      className="sd-btn sd-btn-primary"
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
                      style={{ width: "100%", marginBottom: 8 }}
                    >
                      Firmar y generar comunicado de rechazo
                    </button>

                    {detalle.rutaComunicacionRechazo && (
                      <>
                        <button
                          type="button"
                          className="sd-btn sd-btn-outline"
                          onClick={() => {
                            const base = api.defaults.baseURL || "";
                            window.open(`${base}${detalle.rutaComunicacionRechazo}`, "_blank");
                          }}
                          style={{ width: "100%" }}
                        >
                          Ver comunicado de rechazo
                        </button>

                        <button
                          type="button"
                          className="sd-btn sd-btn-primary"
                          style={{ width: "100%", marginTop: 8 }}
                          onClick={() => {
                            const base = api.defaults.baseURL || "";
                            const link = document.createElement("a");
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
                  <p className="sd-card-note">No hay acciones disponibles para esta solicitud en este momento.</p>
                )}

                {tieneCertificado && (
                  <div style={{ marginTop: "0.75rem" }}>
                    <button
                      type="button"
                      className="sd-btn sd-btn-outline"
                      onClick={handleVerCertificado}
                      style={{ width: "100%" }}
                    >
                      Ver certificado
                    </button>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Panel Solicitante */}
          {esSolicitante && (
            <section className="sd-card">
              <div className="sd-card-head">
                <h2 className="sd-card-title">Acciones</h2>
              </div>

              <div className="sd-card-body">
                <div className="sd-actions">
                  <div className="sd-actions-row">
                    {detalle.rutaCertificado && (
                      <button type="button" className="sd-btn sd-btn-primary" onClick={handleVerCertificado}>
                        Ver certificado
                      </button>
                    )}

                    {detalle.rutaCertificadoRechazo && (
                      <>
                        <button
                          type="button"
                          className="sd-btn sd-btn-danger"
                          onClick={() => {
                            const base = api.defaults.baseURL || "";
                            window.open(`${base}${detalle.rutaCertificadoRechazo}`, "_blank");
                          }}
                        >
                          Ver certificado de rechazo
                        </button>

                        <button
                          type="button"
                          className="sd-btn sd-btn-outline"
                          onClick={() => {
                            const base = api.defaults.baseURL || "";
                            const link = document.createElement("a");
                            link.href = `${base}${detalle.rutaCertificadoRechazo}`;
                            link.download = `Certificado_Rechazo_Solicitud_${detalle.id}.pdf`;
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                          }}
                        >
                          Descargar rechazo
                        </button>
                      </>
                    )}

                    {detalle.rutaComunicacionRechazo && (
                      <>
                        <button
                          type="button"
                          className="sd-btn sd-btn-danger"
                          onClick={() => {
                            const base = api.defaults.baseURL || "";
                            window.open(`${base}${detalle.rutaComunicacionRechazo}`, "_blank");
                          }}
                        >
                          Ver comunicado de rechazo
                        </button>

                        <button
                          type="button"
                          className="sd-btn sd-btn-outline"
                          onClick={() => {
                            const base = api.defaults.baseURL || "";
                            const link = document.createElement("a");
                            link.href = `${base}${detalle.rutaComunicacionRechazo}`;
                            link.download = `Notificacion_Rechazo_Solicitud_${detalle.id}.pdf`;
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                          }}
                        >
                          Descargar notificación
                        </button>
                      </>
                    )}
                  </div>

                  {/* Reupload cuando DEVUELTA */}
                  {esDevuelta && (
                    <div style={{ marginTop: 10 }}>
                      <p className="sd-actions-help">
                        La solicitud fue devuelta. Puedes adjuntar nuevos documentos para corregirla y reenviarla.
                      </p>

                      <input type="file" multiple onChange={handleReuploadChange} />

                      {reuploadFiles.length > 0 && (
                        <div className="sd-docs" style={{ marginTop: 10 }}>
                          {reuploadFiles.map((f, i) => (
                            <div key={`${f.name}-${i}`} className="sd-doc-row">
                              <div className="sd-doc-name">{f.name}</div>
                              <button
                                type="button"
                                className="sd-btn sd-btn-danger"
                                onClick={() =>
                                  setReuploadFiles((prev) => prev.filter((_, idx) => idx !== i))
                                }
                              >
                                Quitar
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      <button
                        type="button"
                        className="sd-btn sd-btn-primary"
                        onClick={handleEnviarNuevosDocs}
                        style={{ marginTop: 12, width: "100%" }}
                      >
                        Enviar nuevos documentos
                      </button>
                    </div>
                  )}

                  {/* Fase 2 solo cuando PendienteFase2 */}
                  {detalle.estado === "PendienteFase2" && (
                    <div style={{ marginTop: 10 }}>
                      <p className="sd-actions-help">
                        Adjunta los documentos requeridos para la Fase 2 y envíalos para validación del VUS.
                      </p>

                      <input type="file" multiple onChange={handleReuploadChange} />

                      {reuploadFiles.length > 0 && (
                        <div className="sd-docs" style={{ marginTop: 10 }}>
                          {reuploadFiles.map((f, i) => (
                            <div key={`${f.name}-${i}`} className="sd-doc-row">
                              <div className="sd-doc-name">{f.name}</div>
                              <button
                                type="button"
                                className="sd-btn sd-btn-danger"
                                onClick={() =>
                                  setReuploadFiles((prev) => prev.filter((_, idx) => idx !== i))
                                }
                              >
                                Quitar
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      <button
                        type="button"
                        className="sd-btn sd-btn-primary"
                        onClick={handleEnviarNuevosDocs}
                        style={{ marginTop: 12, width: "100%" }}
                      >
                        Enviar documentos de Fase 2
                      </button>
                    </div>
                  )}

                  {esRechazada && (
                    <p className="sd-card-note" style={{ marginTop: 10 }}>
                      La solicitud fue rechazada de forma definitiva. No es posible adjuntar nuevos documentos.
                    </p>
                  )}

                  {!esAprobada && !esDevuelta && !esRechazada && detalle.estado !== "PendienteFase2" && (
                    <p className="sd-card-note" style={{ marginTop: 10 }}>
                      No hay acciones adicionales disponibles para el estado actual.
                    </p>
                  )}
                </div>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
