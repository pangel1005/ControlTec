// src/pages/solicitante/NuevaSolicitud.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/apiClient";
import BackButton from "../../components/BackButtonClean.jsx";
import "./NuevaSolicitud.css";

export default function NuevaSolicitud() {
  const navigate = useNavigate();

  const [servicios, setServicios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [expandedId, setExpandedId] = useState(null);
  const [filesByService, setFilesByService] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const cargarServicios = async () => {
      setLoading(true);
      setError("");

      try {
        const res = await api.get("/api/Servicios?soloActivos=true");
        setServicios(res.data || []);
      } catch (err) {
        console.error(err);
        setError("No se pudieron cargar los servicios disponibles.");
      } finally {
        setLoading(false);
      }
    };

    cargarServicios();
  }, []);

  // ================== HELPERS PDF ==================

  const openRuta = (ruta) => {
    if (!ruta) {
      alert("No hay archivo configurado para este servicio.");
      return;
    }
    const base = api.defaults.baseURL || "";
    const url = `${base}${ruta}`;
    window.open(url, "_blank");
  };

  const getRutaByServiceId = (serviceId) => {
    const s = servicios.find((x) => (x.id ?? x.Id) === serviceId);
    if (!s) return null;
    return s.rutaFormularioBase || s.RutaFormularioBase || null;
  };

  // ================== HANDLERS LÓGICA UI ==================

  const getDocsRequeridos = (servicio) =>
    servicio.documentosRequeridos ||
    servicio.DocumentosRequeridos ||
    servicio.documentosrequeridos ||
    [];

  const handleStartSolicitud = (servicioId, servicio) => {
    // MISMA FUNCIONALIDAD: solo servicio 4 y 5 expanden para subir docs
    if (servicio.id === 4 || servicio.id === 5) {
      setExpandedId(servicioId);
    } else {
      navigate(`/formulario-digital/${servicioId}`);
    }
  };

  const handleCancelSolicitud = (servicioId) => {
    setExpandedId(null);
    setFilesByService((prev) => {
      const copy = { ...prev };
      delete copy[servicioId];
      return copy;
    });
  };

  const handleFilesSelected = (servicioId, fileList) => {
    const files = Array.from(fileList || []);
    setFilesByService((prev) => ({
      ...prev,
      [servicioId]: files,
    }));
  };

  const handleDrop = (servicioId, e) => {
    e.preventDefault();
    if (!e.dataTransfer.files?.length) return;
    handleFilesSelected(servicioId, e.dataTransfer.files);
  };

  // 👉 Botón "Rellenar formulario"
  const handleDownloadFormulario = (servicio) => {
    navigate(`/formulario-digital/${servicio.id}`);
  };

  // 👉 Botón "Descargar pdf con más información"
  const handleDownloadInfo = (servicio) => {
    if (servicio.id >= 1 && servicio.id <= 5) {
      const ruta = servicio.rutaFormularioBase;
      if (!ruta) {
        alert("Este servicio no tiene PDF informativo configurado.");
        return;
      }
      openRuta(ruta);
      return;
    }

    alert(
      `Descarga de PDF informativo para el servicio "${servicio.nombre}" pendiente de implementar.`
    );
  };

  // ================== GUARDAR EN BD ==================

  const handleSubirDocumentos = async (servicio) => {
    const files = filesByService[servicio.id] || [];

    if (files.length === 0) {
      alert("Debes adjuntar al menos un documento.");
      return;
    }

    const confirmado = window.confirm(
      `¿Confirmas enviar la solicitud para "${servicio.nombre}" con ${files.length} documento(s)?`
    );

    if (!confirmado || submitting) return;

    try {
      setSubmitting(true);

      // 1) Crear la solicitud con estado PENDIENTE (el backend lo maneja)
      const iniciarRes = await api.post("/api/Solicitudes/iniciar", {
        servicioId: servicio.id,
      });

      const solicitudId =
        iniciarRes.data.id ?? iniciarRes.data.Id ?? iniciarRes.data.solicitudId;

      if (!solicitudId) {
        throw new Error("No se pudo obtener el Id de la solicitud creada.");
      }

      // 2) Subir cada documento a /api/Solicitudes/{id}/documentos
      for (const file of files) {
        const formData = new FormData();
        formData.append("archivo", file);

        await api.post(`/api/Solicitudes/${solicitudId}/documentos`, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
      }

      // 3) 🚀 AHORA SÍ marcamos la solicitud como enviada/depositada
      await api.post(`/api/Solicitudes/${solicitudId}/enviar`, {
        comentario: "Solicitud enviada desde el portal de ControlTec.",
      });

      // 4) Redirigir a Mis solicitudes con mensaje de éxito
      navigate("/mis-solicitudes", {
        state: {
          successMessage: `Tu solicitud para "${servicio.nombre}" fue enviada correctamente.`,
        },
      });
    } catch (err) {
      console.error("Error al enviar solicitud:", err);
      console.error("Status:", err.response?.status);
      console.error("Respuesta del backend:", err.response?.data);
      alert(
        "Ocurrió un error al guardar la solicitud o subir los documentos. Inténtalo de nuevo."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ================== RENDER ==================
  if (loading) {
    return (
      <div className="ns-page-container">
        <BackButton />
        <div className="ns-header-container">
          <div className="ns-header-content">
            <h1 className="ns-title">Iniciar nueva solicitud</h1>
            <p className="ns-subtitle">Cargando servicios disponibles...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="ns-page-container">
      <BackButton />

      <div className="ns-header-container">
        <div className="ns-header-content">
          <h1 className="ns-title">Iniciar nueva solicitud</h1>
          <p className="ns-subtitle">
            Selecciona el servicio para el cual deseas iniciar una solicitud.
          </p>
        </div>
      </div>

      {error && !loading && <div className="ns-error-msg">{error}</div>}

      {!loading && !error && servicios.length === 0 && (
        <p className="ns-status-msg">No hay servicios disponibles en este momento.</p>
      )}

      {!loading && !error && servicios.length > 0 && (
        <div className="ns-services-grid">
          {servicios.map((servicioRaw) => {
            const servicio = {
              id: servicioRaw.id ?? servicioRaw.Id,
              nombre: servicioRaw.nombre ?? servicioRaw.Nombre,
              descripcion: servicioRaw.descripcion ?? servicioRaw.Descripcion,
              costo: servicioRaw.costo ?? servicioRaw.Costo,
              requierePago:
                servicioRaw.requierePago ?? servicioRaw.RequierePago ?? false,
              rutaFormularioBase:
                servicioRaw.rutaFormularioBase ?? servicioRaw.RutaFormularioBase,
              documentosRequeridos: getDocsRequeridos(servicioRaw),
            };

            const isExpanded = expandedId === servicio.id;
            const docsRequeridos = servicio.documentosRequeridos || [];
            const selectedFiles = filesByService[servicio.id] || [];
            const canSubmit = selectedFiles.length >= 1 && !submitting;

            return (
              <div key={servicio.id} className="ns-card">
                <div className="ns-card-header">
                  <h2 className="ns-card-title">{servicio.nombre}</h2>
                </div>

                {/* Descripción (vertical) */}
                <p className="ns-desc">
                  {servicio.descripcion ??
                    "Descripción no disponible para este servicio."}
                </p>

                {/* Requerimientos (box) */}
                <div className="ns-reqbox">
                  <h3 className="ns-reqs-title">REQUERIMIENTOS</h3>

                  {docsRequeridos.length === 0 ? (
                    <p className="ns-reqs-empty">
                      Este servicio aún no tiene requerimientos configurados.
                    </p>
                  ) : (
                    <ul className="ns-reqs-list">
                      {docsRequeridos.map((doc) => (
                        <li key={doc.id ?? doc.Id}>
                          {doc.nombre ?? doc.Nombre}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Acciones (abajo, 2 botones) */}
                <div className="ns-actions">
                  <button
                    type="button"
                    className="ns-btn ns-btn-outline"
                    onClick={() => handleDownloadInfo(servicio)}
                  >
                    Descargar info PDF
                  </button>

                  {!isExpanded ? (
                    <button
                      type="button"
                      className="ns-btn ns-btn-primary"
                      onClick={() => handleStartSolicitud(servicio.id, servicio)}
                    >
                      Iniciar solicitud
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="ns-btn ns-btn-danger"
                      onClick={() => handleCancelSolicitud(servicio.id)}
                    >
                      Cancelar
                    </button>
                  )}
                </div>

                {/* Upload Dropzone (Expanded) */}
                {isExpanded && (
                  <div className="ns-upload-section">
                    <p className="ns-upload-hint">
                      Por favor adjunte los documentos requeridos:
                    </p>

                    <div
                      className="ns-dropzone"
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => handleDrop(servicio.id, e)}
                      onClick={() =>
                        document
                          .getElementById(`file-input-${servicio.id}`)
                          ?.click()
                      }
                    >
                      {selectedFiles.length === 0 ? (
                        <span className="ns-dropzone-text">
                          Arrastra los archivos aquí o haz clic para seleccionarlos.
                        </span>
                      ) : (
                        <div className="ns-file-list">
                          {selectedFiles.map((file, idx) => (
                            <span key={idx} className="ns-file-item">
                              {file.name}
                            </span>
                          ))}
                        </div>
                      )}

                      <input
                        id={`file-input-${servicio.id}`}
                        type="file"
                        multiple
                        style={{ display: "none" }}
                        onChange={(e) =>
                          handleFilesSelected(servicio.id, e.target.files)
                        }
                      />
                    </div>

                    <div className="ns-upload-actions">
                      <button
                        type="button"
                        className={`ns-btn ns-btn-primary ${
                          !canSubmit ? "ns-btn-disabled" : ""
                        }`}
                        style={{ width: "100%" }}
                        disabled={!canSubmit}
                        onClick={() => handleSubirDocumentos(servicio)}
                      >
                        {submitting ? "Enviando..." : "Enviar solicitud"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
