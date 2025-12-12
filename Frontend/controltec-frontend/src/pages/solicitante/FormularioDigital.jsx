// src/pages/solicitante/FormularioDigital.jsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api/apiClient";
import BackButton from "../../components/BackButtonClean.jsx";
import { useAuth } from "../../context/AuthContext";

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
        const res = await api.get(`/api/FormulariosDigitales/subservicio/${subservicioId}`);
        const rawForm = res.data || {};
        setFormulario(rawForm);

        // Obtener información del servicio asociado
        const servicioId = rawForm.servicioId || rawForm.ServicioId || Number(subservicioId);
        if (servicioId) {
          const servicioRes = await api.get(`/api/Servicios/${servicioId}`);
          setServicio(servicioRes.data);
        }
      } catch (err) {
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
      // 1) Crear la solicitud con estado PENDIENTE (el backend lo maneja automáticamente)
      const iniciarRes = await api.post("/api/Solicitudes/iniciar", {
        servicioId: servicio.id ?? servicio.Id ?? Number(subservicioId)
      });
      
      const solicitudId = iniciarRes.data.id ?? iniciarRes.data.Id ?? iniciarRes.data.solicitudId;
      if (!solicitudId) throw new Error("No se pudo obtener el Id de la solicitud creada.");

      // 2) Guardar respuestas del formulario digital vinculadas a la solicitud
      await api.post("/api/RespuestasFormulariosDigitales", {
        solicitudId,
        formularioDigitalId: formulario.id ?? formulario.Id,
        respuestasJson: JSON.stringify(valores || {}),
      });

      // 3) Subir archivos PDF adjuntos
      for (const file of archivos) {
        const formData = new FormData();
        formData.append("archivo", file);
        await api.post(`/api/Solicitudes/${solicitudId}/documentos`, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
      }

      // 4) 🚀 AHORA SÍ enviamos/depositamos la solicitud
      await api.post(`/api/Solicitudes/${solicitudId}/enviar`, {
        comentario: "Solicitud enviada con formulario digital completado."
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

  // Renderizado de campos dinámicos
  let campos = [];
  try {
    if (formulario && formulario.estructuraJson) {
      const parsed = JSON.parse(formulario.estructuraJson);
      campos = parsed.campos || parsed.fields || [];
    }
  } catch (e) {
    campos = [];
  }

  // Prellenar campos automáticamente
  useEffect(() => {
    if (!usuario) return;
    if (!formulario || !formulario.estructuraJson) return;
    
    let parsed;
    try {
      parsed = JSON.parse(formulario.estructuraJson);
    } catch {
      return;
    }
    
    const campos = parsed.campos || parsed.fields || [];
    for (const campo of campos) {
      const nombre = (campo.nombre || "").toLowerCase();
      const etiqueta = (campo.etiqueta || "").toLowerCase();
      
      // Autocompletar cédula
      if ((nombre.includes("cedula") || etiqueta.includes("cedula")) && usuario.cedula) {
        setValores((prev) => (
          prev[campo.nombre] ? prev : { ...prev, [campo.nombre]: usuario.cedula }
        ));
      }
      
      // Autocompletar email/correo
      if ((nombre.includes("email") || nombre.includes("correo") || 
           etiqueta.includes("email") || etiqueta.includes("correo")) && usuario.correo) {
        setValores((prev) => (
          prev[campo.nombre] ? prev : { ...prev, [campo.nombre]: usuario.correo }
        ));
      }
      
      // Autocompletar nombre
      if ((nombre.includes("nombre") || etiqueta.includes("nombre")) && usuario.nombre) {
        setValores((prev) => (
          prev[campo.nombre] ? prev : { ...prev, [campo.nombre]: usuario.nombre }
        ));
      }
    }
  }, [usuario, formulario]);

  return (
    <div className="page">
      <BackButton fallback="/mis-solicitudes" />
      <h1>Formulario Digital</h1>
      {error && <div className="login-error-banner">{error}</div>}
      {!formulario && !error && <p>Cargando formulario...</p>}

      {/* Nombre del subservicio y requisitos */}
      {servicio && (
        <div style={{ marginBottom: 24 }}>
          {servicio.nombre && (
            <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>{servicio.nombre}</h2>
          )}
          <div>
            <strong>Requisitos:</strong>
            {servicio.documentosRequeridos && servicio.documentosRequeridos.length > 0 ? (
              <ul style={{ marginTop: 4 }}>
                {servicio.documentosRequeridos.map((doc, idx) => (
                  <li key={doc.id ?? doc.Id ?? idx}>{doc.nombre ?? doc.Nombre}</li>
                ))}
              </ul>
            ) : (
              <span style={{ color: "#6b7280", marginLeft: 8 }}>
                No hay requisitos adicionales para este servicio.
              </span>
            )}
          </div>
        </div>
      )}

      {formulario && campos.length > 0 && (
        <form onSubmit={handleSubmit} className="admin-form" style={{ maxWidth: 600 }}>
          {campos.map((campo, idx) => (
            <div key={campo.nombre || idx} className="form-group">
              <label>
                {campo.etiqueta || campo.nombre}
                {campo.requerido && <span style={{ color: "#ef4444" }}> *</span>}
              </label>
              {campo.tipo === "texto" && (
                <input
                  type="text"
                  value={valores[campo.nombre] || ""}
                  onChange={(e) => handleChange(campo.nombre, e.target.value)}
                  required={campo.requerido}
                />
              )}
              {campo.tipo === "checkbox" && (
                <input
                  type="checkbox"
                  checked={!!valores[campo.nombre]}
                  onChange={(e) => handleChange(campo.nombre, e.target.checked)}
                />
              )}
              {campo.tipo === "seleccion" && Array.isArray(campo.opciones) && (
                <select
                  value={valores[campo.nombre] || ""}
                  onChange={(e) => handleChange(campo.nombre, e.target.value)}
                  required={campo.requerido}
                >
                  <option value="">Seleccione una opción</option>
                  {campo.opciones.map((op, i) => (
                    <option key={i} value={op}>{op}</option>
                  ))}
                </select>
              )}
            </div>
          ))}

          {/* Área para subir archivos (cualquier tipo, como en servicios 4 y 5) */}
          <div className="form-group">
            <label>Adjuntar archivos (opcional)</label>
            <input
              type="file"
              multiple
              onChange={(e) => setArchivos(Array.from(e.target.files))}
            />
            {archivos.length > 0 && (
              <ul style={{ marginTop: 8 }}>
                {archivos.map((file, idx) => (
                  <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {file.name}
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
                      onClick={() => setArchivos(prev => prev.filter((_, i) => i !== idx))}
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <button type="submit" className="btn-primary" disabled={enviando}>
            {enviando ? "Enviando..." : "Enviar formulario"}
          </button>
        </form>
      )}
      
      {formulario && campos.length === 0 && (
        <p>Este formulario no tiene campos configurados.</p>
      )}
    </div>
  );
}