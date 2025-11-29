// src/pages/solicitudes/NuevaSolicitud.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/apiClient";

export default function NuevaSolicitud() {
    const navigate = useNavigate();
  const [servicios, setServicios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [expandedId, setExpandedId] = useState(null);
  const [filesByService, setFilesByService] = useState({});

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

  // Abre una ruta relativa de la API en una nueva pestaña
  const openRuta = (ruta) => {
    if (!ruta) {
      alert("No hay archivo configurado para este servicio.");
      return;
    }
    const base = api.defaults.baseURL || "";
    const url = `${base}${ruta}`;
    window.open(url, "_blank");
  };

  // Devuelve RutaFormularioBase de un servicio por Id (para A y B)
  const getRutaByServiceId = (serviceId) => {
    const s = servicios.find(
      (x) => (x.id ?? x.Id) === serviceId
    );
    if (!s) return null;
    return s.rutaFormularioBase || s.RutaFormularioBase || null;
  };

  // ================== HANDLERS LÓGICA UI ==================

  const getDocsRequeridos = (servicio) =>
    servicio.documentosRequeridos ||
    servicio.DocumentosRequeridos ||
    servicio.documentosrequeridos ||
    [];

  const handleStartSolicitud = (servicioId) => {
    setExpandedId(servicioId);
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

  // 👉 NUEVA LÓGICA: qué abre cada botón

  // Botón "Descargar formulario para rellenar"
  const handleDownloadFormulario = (servicio) => {
    let ruta = null;

    // IDs según tu seed de BD:
    // 1..5 = LI-UPC-01..05
    // 6 = Solicitud A
    // 7 = Solicitud B-2

    if (servicio.id === 1) {
      // LI-UPC-01 usa Formulario A
      ruta = getRutaByServiceId(6); // Solicitud A
    } else if (servicio.id === 2 || servicio.id === 3) {
      // LI-UPC-02 y 03 usan Formulario B
      ruta = getRutaByServiceId(7); // Solicitud B-2
    } else if (servicio.id === 4 || servicio.id === 5) {
      // LI-UPC-04 y 05: por ahora NO tienen A/B
      alert(
        "Este servicio no tiene un formulario A/B asociado. Utiliza el PDF informativo."
      );
      return;
    } else {
      // Solicitud A (6) y B-2 (7) se quedan como estaban:
      ruta = servicio.rutaFormularioBase;
    }

    if (!ruta) {
      alert("No se encontró el formulario para este servicio.");
      return;
    }

    openRuta(ruta);
  };

  // Botón "Descargar pdf con más información"
  const handleDownloadInfo = (servicio) => {
    // Para LI-UPC-01..05 usamos su propio LI-UPC-0X.pdf
    if (servicio.id >= 1 && servicio.id <= 5) {
      const ruta = servicio.rutaFormularioBase;
      if (!ruta) {
        alert("Este servicio no tiene PDF informativo configurado.");
        return;
      }
      openRuta(ruta);
      return;
    }

    // Para Solicitud A y B-2 (6 y 7) lo dejamos como mensaje por ahora
    alert(
      `Descarga de PDF informativo para el servicio "${servicio.nombre}" pendiente de implementar.`
    );
  };

const handleSubirDocumentos = (servicio) => {
  const files = filesByService[servicio.id] || [];

  const confirmado = window.confirm(
    `¿Confirmas enviar la solicitud para "${servicio.nombre}" con ${files.length} documento(s)?`
  );

  if (!confirmado) return;

  // 👉 Aquí en el futuro haremos:
  // 1) Crear la solicitud en backend
  // 2) Subir los PDFs
  // Por ahora solo simulamos el flujo y redirigimos.

  navigate("/mis-solicitudes", {
    state: {
      successMessage: `Tu solicitud para "${servicio.nombre}" fue enviada correctamente.`,
    },
  });
};

  // ================== RENDER ==================

  return (
    <div className="page-container nueva-solicitud-page">
      <div className="nueva-solicitud-header">
        <div>
          <h1 className="nueva-solicitud-title">Iniciar nueva solicitud</h1>
          <p className="nueva-solicitud-subtitle">
            Selecciona el servicio para el cual deseas iniciar una solicitud.
          </p>
        </div>
      </div>

      {loading && <p>Cargando servicios...</p>}
      {error && !loading && <p className="login-error">{error}</p>}
      {!loading && !error && servicios.length === 0 && (
        <p className="nueva-solicitud-empty">
          No hay servicios disponibles en este momento.
        </p>
      )}

      {!loading &&
        !error &&
        servicios.map((servicioRaw) => {
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

        // ✅ El botón se habilita si hay al menos 1 archivo
        const canSubmit = selectedFiles.length >= 1;


          return (
            <div
              key={servicio.id}
              className={`servicio-block ${
                isExpanded ? "servicio-block-expanded" : ""
              }`}
            >
              <div className="servicio-block-header">
                <h2 className="servicio-block-title">{servicio.nombre}</h2>
              </div>

              <div className="servicio-block-content">
                <div className="servicio-col servicio-col-descripcion">
                  <p className="servicio-description-text">
                    {servicio.descripcion ??
                      "Descripción no disponible para este servicio."}
                  </p>
                </div>

                <div className="servicio-col servicio-col-requerimientos">
                  <h3 className="servicio-col-title">Requerimientos:</h3>
                  {docsRequeridos.length === 0 ? (
                    <p className="servicio-requerimientos-empty">
                      Este servicio aún no tiene requerimientos configurados.
                    </p>
                  ) : (
                    <ul className="servicio-requerimientos-list">
                      {docsRequeridos.map((doc) => (
                        <li key={doc.id ?? doc.Id}>
                          {doc.nombre ?? doc.Nombre}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="servicio-col servicio-col-acciones">
                  <button
                    type="button"
                    className="btn-outline servicio-side-btn"
                    onClick={() => handleDownloadInfo(servicio)}
                  >
                    Descargar pdf con más información
                  </button>

                  <button
                    type="button"
                    className="btn-outline servicio-side-btn"
                    onClick={() => handleDownloadFormulario(servicio)}
                  >
                    Descargar formulario para rellenar
                  </button>

                  {!isExpanded && (
                    <button
                      type="button"
                      className="btn-primary servicio-side-btn"
                      onClick={() => handleStartSolicitud(servicio.id)}
                    >
                      Iniciar solicitud
                    </button>
                  )}
                </div>
              </div>

              {isExpanded && (
                <div className="servicio-upload-section">
                  <p className="servicio-upload-text">
                    Por favor adjunte los documentos requeridos antes
                    señalados:
                  </p>

                  <div
                    className="upload-dropzone"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => handleDrop(servicio.id, e)}
                    onClick={() =>
                      document
                        .getElementById(`file-input-${servicio.id}`)
                        ?.click()
                    }
                  >
                    {selectedFiles.length === 0 ? (
                      <span className="upload-dropzone-placeholder">
                        Arrastra los archivos aquí o haz clic para
                        seleccionarlos.
                      </span>
                    ) : (
                      <ul className="upload-file-list">
                        {selectedFiles.map((file, idx) => (
                          <li key={idx}>{file.name}</li>
                        ))}
                      </ul>
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

                  <div className="upload-actions">
                    <button
                      type="button"
                      className={`btn-primary upload-submit-btn ${
                        !canSubmit ? "btn-disabled" : ""
                      }`}
                      disabled={!canSubmit}
                      onClick={() => handleSubirDocumentos(servicio)}
                    >
                      Subir documentos
                    </button>

                    <button
                      type="button"
                      className="btn-danger upload-cancel-btn"
                      onClick={() => handleCancelSolicitud(servicio.id)}
                    >
                      Cancelar solicitud
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
    </div>
  );
}
