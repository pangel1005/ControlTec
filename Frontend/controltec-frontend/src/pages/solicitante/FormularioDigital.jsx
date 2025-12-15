// src/pages/solicitante/FormularioDigital.jsx
import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api/apiClient";
import BackButton from "../../components/BackButtonClean.jsx";
import { useAuth } from "../../context/AuthContext";
import "./FormularioDigital.css";

export default function FormularioDigital() {
  const { usuario } = useAuth();
  const { subservicioId } = useParams();
  const navigate = useNavigate();

  const [formulario, setFormulario] = useState(null);
  const [servicio, setServicio] = useState(null);

  const [valores, setValores] = useState({});
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [archivos, setArchivos] = useState([]);

  useEffect(() => {
    const cargarFormulario = async () => {
      setError("");
      try {
        const res = await api.get(
          `/api/FormulariosDigitales/subservicio/${subservicioId}`
        );
        const rawForm = res.data || {};
        setFormulario(rawForm);

        // Obtener información del servicio asociado
        const servicioId =
          rawForm.servicioId || rawForm.ServicioId || Number(subservicioId);

        if (servicioId) {
          const servicioRes = await api.get(`/api/Servicios/${servicioId}`);
          setServicio(servicioRes.data);
        } else {
          setServicio(null);
        }
      } catch (err) {
        console.error(err);
        setError("No se pudo cargar el formulario digital.");
      }
    };

    cargarFormulario();
  }, [subservicioId]);

  const handleChange = (campo, valor) => {
    setValores((prev) => ({ ...prev, [campo]: valor }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setEnviando(true);

    try {
      // 1) Crear la solicitud con estado PENDIENTE (backend lo maneja)
      const servicioIdParaSolicitud =
        (servicio?.id ?? servicio?.Id) || Number(subservicioId);

      const iniciarRes = await api.post("/api/Solicitudes/iniciar", {
        servicioId: servicioIdParaSolicitud,
      });

      const solicitudId =
        iniciarRes.data.id ?? iniciarRes.data.Id ?? iniciarRes.data.solicitudId;

      if (!solicitudId) {
        throw new Error("No se pudo obtener el Id de la solicitud creada.");
      }

      // 2) Guardar respuestas del formulario digital vinculadas a la solicitud
      await api.post("/api/RespuestasFormulariosDigitales", {
        solicitudId,
        formularioDigitalId: formulario?.id ?? formulario?.Id,
        respuestasJson: JSON.stringify(valores || {}),
      });

      // 3) Subir archivos adjuntos (opcional)
      for (const file of archivos) {
        const formData = new FormData();
        formData.append("archivo", file);

        await api.post(`/api/Solicitudes/${solicitudId}/documentos`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      // 4) Enviar/depositar la solicitud
      await api.post(`/api/Solicitudes/${solicitudId}/enviar`, {
        comentario: "Solicitud enviada con formulario digital completado.",
      });

      // 5) Redirigir a Mis solicitudes con mensaje de éxito
      navigate("/mis-solicitudes", {
        state: { successMessage: "Formulario enviado correctamente." },
      });
    } catch (err) {
      console.error("Error al enviar formulario:", err);
      setError("Error al enviar el formulario y/o archivos. Intenta de nuevo.");
    } finally {
      setEnviando(false);
    }
  };

  // ============ Campos dinámicos (misma lógica) ============
  const campos = useMemo(() => {
    try {
      if (formulario?.estructuraJson) {
        const parsed = JSON.parse(formulario.estructuraJson);
        return parsed.campos || parsed.fields || [];
      }
    } catch {
      // ignore
    }
    return [];
  }, [formulario]);

  // Prellenar campos automáticamente (misma funcionalidad)
  useEffect(() => {
    if (!usuario) return;
    if (!formulario?.estructuraJson) return;

    let parsed;
    try {
      parsed = JSON.parse(formulario.estructuraJson);
    } catch {
      return;
    }

    const camposParsed = parsed.campos || parsed.fields || [];

    for (const campo of camposParsed) {
      const nombre = (campo.nombre || "").toLowerCase();
      const etiqueta = (campo.etiqueta || "").toLowerCase();

      // Autocompletar cédula
      if (
        (nombre.includes("cedula") || etiqueta.includes("cedula")) &&
        usuario.cedula
      ) {
        setValores((prev) =>
          prev[campo.nombre] ? prev : { ...prev, [campo.nombre]: usuario.cedula }
        );
      }

      // Autocompletar email/correo
      if (
        (nombre.includes("email") ||
          nombre.includes("correo") ||
          etiqueta.includes("email") ||
          etiqueta.includes("correo")) &&
        usuario.correo
      ) {
        setValores((prev) =>
          prev[campo.nombre] ? prev : { ...prev, [campo.nombre]: usuario.correo }
        );
      }

      // Autocompletar nombre
      if (
        (nombre.includes("nombre") || etiqueta.includes("nombre")) &&
        usuario.nombre
      ) {
        setValores((prev) =>
          prev[campo.nombre] ? prev : { ...prev, [campo.nombre]: usuario.nombre }
        );
      }
    }
  }, [usuario, formulario]);

  // Requisitos (sin cambiar cómo los obtienes, solo soporta variantes)
  const servicioNombre =
    servicio?.nombre ?? servicio?.Nombre ?? "Servicio";

  const documentosRequeridos =
    servicio?.documentosRequeridos ??
    servicio?.DocumentosRequeridos ??
    servicio?.documentosrequeridos ??
    [];

  return (
    <div className="fd-page">
      <div className="fd-container">
        <BackButton fallback="/mis-solicitudes" />

        <div className="fd-header">
          <div>
            <h1 className="fd-title">Formulario digital</h1>
            <p className="fd-subtitle">
              Completa el formulario y adjunta documentos si aplica.
            </p>
          </div>

          {servicio && <span className="fd-badge">{servicioNombre}</span>}
        </div>

        {error && <div className="login-error-banner">{error}</div>}
        {!formulario && !error && <p>Cargando formulario...</p>}

        {formulario && (
          <div className="fd-layout">
            {/* MAIN */}
            <main className="fd-main">
              <section className="fd-card">
                <div className="fd-card-head">
                  <h2 className="fd-card-title">Datos del solicitante</h2>
                  <span className="fd-badge">ID {subservicioId}</span>
                </div>

                {campos.length > 0 ? (
                  <form onSubmit={handleSubmit} className="fd-form">
                    <div className="fd-form-grid">
                      {campos.map((campo, idx) => (
                        <div key={campo.nombre || idx} className="form-group fd-field">
                          <label>
                            {campo.etiqueta || campo.nombre}
                            {campo.requerido && (
                              <span style={{ color: "#ef4444" }}> *</span>
                            )}
                          </label>

                          {campo.tipo === "texto" && (
                            <input
                              type="text"
                              value={valores[campo.nombre] || ""}
                              onChange={(e) =>
                                handleChange(campo.nombre, e.target.value)
                              }
                              required={campo.requerido}
                            />
                          )}

                          {campo.tipo === "checkbox" && (
                            <div className="fd-checkbox">
                              <input
                                type="checkbox"
                                checked={!!valores[campo.nombre]}
                                onChange={(e) =>
                                  handleChange(campo.nombre, e.target.checked)
                                }
                              />
                              <span>
                                {campo.etiqueta || campo.nombre}
                                {campo.requerido && (
                                  <span style={{ color: "#ef4444" }}> *</span>
                                )}
                              </span>
                            </div>
                          )}

                          {campo.tipo === "seleccion" &&
                            Array.isArray(campo.opciones) && (
                              <select
                                value={valores[campo.nombre] || ""}
                                onChange={(e) =>
                                  handleChange(campo.nombre, e.target.value)
                                }
                                required={campo.requerido}
                              >
                                <option value="">Seleccione una opción</option>
                                {campo.opciones.map((op, i) => (
                                  <option key={i} value={op}>
                                    {op}
                                  </option>
                                ))}
                              </select>
                            )}
                        </div>
                      ))}
                    </div>

                    {/* Upload de archivos (opcional) */}
                    <div className="fd-upload">
                      <label className="fd-reqs-title">
                        Adjuntar archivos (opcional)
                      </label>

                      <input
                        id="fd-file-input"
                        className="fd-file-input"
                        type="file"
                        multiple
                        onChange={(e) => setArchivos(Array.from(e.target.files))}
                      />

                      <label htmlFor="fd-file-input" className="fd-dropzone">
                        <p className="fd-dropzone-title">
                          Arrastra aquí o haz clic para seleccionar archivos
                        </p>
                        <p className="fd-dropzone-sub">
                          Puedes adjuntar varios documentos.
                        </p>

                        {archivos.length > 0 && (
                          <ul className="fd-file-list">
                            {archivos.map((file, idx) => (
                              <li key={idx} className="fd-file-item">
                                <span className="fd-file-name">{file.name}</span>
                                <button
                                  type="button"
                                  className="fd-file-remove"
                                  aria-label="Eliminar archivo"
                                  onClick={() =>
                                    setArchivos((prev) =>
                                      prev.filter((_, i) => i !== idx)
                                    )
                                  }
                                >
                                  ×
                                </button>
                              </li>
                            ))}
                          </ul>
                        )}
                      </label>
                    </div>

                    <div className="fd-actions">
                      <button
                        type="submit"
                        className="btn-primary"
                        disabled={enviando}
                      >
                        {enviando ? "Enviando..." : "Enviar formulario"}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="fd-card-body">
                    <p>Este formulario no tiene campos configurados.</p>
                  </div>
                )}
              </section>
            </main>

            {/* SIDE */}
            <aside className="fd-side">
              <section className="fd-card">
                <div className="fd-card-head">
                  <h3 className="fd-card-title">Requisitos</h3>
                </div>

                <div className="fd-card-body">
                  <h4 className="fd-reqs-title">{servicioNombre}</h4>

                  {documentosRequeridos?.length > 0 ? (
                    <ul className="fd-reqs-list">
                      {documentosRequeridos.map((doc, idx) => (
                        <li key={doc.id ?? doc.Id ?? idx}>
                          {doc.nombre ?? doc.Nombre}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="fd-reqs-empty">
                      No hay requisitos adicionales para este servicio.
                    </p>
                  )}
                </div>
              </section>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}
