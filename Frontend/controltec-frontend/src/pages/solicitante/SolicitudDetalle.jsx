// src/pages/solicitante/SolicitudDetalle.jsx
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

  const handleEnviarNuevosDocs = () => {
    if (reuploadFiles.length === 0) {
      alert("Debes seleccionar al menos un documento.");
      return;
    }

    alert(
      "Reenvío de documentos pendiente de implementar en el backend. Solo es una vista de ejemplo."
    );
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
      await api.post(`/api/Solicitudes/${detalle.id}/cambiar-estado`, {
        estadoNuevo: "Validación Recepción",
        comentario:
          comentarioVus ||
          "Documentación verificada por VUS. Se remite a la siguiente revisión.",
      });

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
        estadoNuevo: "RechazarET",
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

      await cargarDetalle();
      alert(
        "Solicitud aprobada y firmada por Dirección. Luego podrás generar o ver el certificado."
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
                Verifica que todos los documentos requeridos estén cargados. Si
                están completos, puedes enviar la solicitud a la siguiente
                revisión. Si faltan documentos, devuélvela al solicitante
                indicando el motivo.
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
                  disabled={accionesBloqueadas}
                >
                  Confirmar revisión y enviar
                </button>

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
                placeholder="Comentario para el solicitante o para el flujo (observaciones, motivo de devolución/rechazo)..."
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
                  onClick={handleUpcRechazar}
                  disabled={accionesBloqueadas}
                >
                  Rechazar solicitud
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

          {/* Acciones del solicitante */}
          {esSolicitante && (
            <section className="detalle-section detalle-full-width">
              <h2 className="detalle-section-title">Acciones</h2>

              {esAprobada && (
                <button
                  type="button"
                  className="btn-primary"
                  disabled
                  title="Descarga de certificación pendiente de implementar para el solicitante."
                >
                  Descargar certificación (próximamente)
                </button>
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
