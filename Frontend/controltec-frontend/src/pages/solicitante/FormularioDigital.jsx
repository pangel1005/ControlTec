// src/pages/solicitante/FormularioDigital.jsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api/apiClient";
import BackButton from "../../components/BackButtonClean.jsx";

export default function FormularioDigital() {
  const { subservicioId } = useParams();
  const navigate = useNavigate();
  const [formulario, setFormulario] = useState(null);
  const [servicio, setServicio] = useState(null);
  const [valores, setValores] = useState({});
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

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
      // 1) Crear la solicitud en el backend (estado Pendiente)
      const iniciarRes = await api.post("/api/Solicitudes/iniciar", {
        servicioId: servicio.id ?? servicio.Id ?? Number(subservicioId),
      });
      const solicitudId = iniciarRes.data.id ?? iniciarRes.data.Id ?? iniciarRes.data.solicitudId;
      if (!solicitudId) throw new Error("No se pudo obtener el Id de la solicitud creada.");

      // 2) Guardar respuestas del formulario digital vinculadas a la solicitud
      await api.post("/api/RespuestasFormulariosDigitales", {
        solicitudId,
        formularioDigitalId: formulario.id ?? formulario.Id,
        respuestasJson: JSON.stringify(valores || {}),
      });

      // 3) Redirigir a Mis solicitudes con mensaje de éxito
      navigate("/mis-solicitudes", {
        state: { successMessage: "Formulario enviado correctamente." },
      });
    } catch (err) {
      setError("Error al enviar el formulario y archivos. Intenta de nuevo.");
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

  return (
    <div className="page">
      <BackButton fallback="/mis-solicitudes" />
      <h1>Formulario Digital</h1>
      {error && <div className="login-error-banner">{error}</div>}
      {!formulario && !error && <p>Cargando formulario...</p>}
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
