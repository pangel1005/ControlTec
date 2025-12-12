// src/pages/admin/CrearServicio.jsx
import { useState } from "react";
import api from "../../api/apiClient";
import { useNavigate } from "react-router-dom";
import BackButton from "../../components/BackButtonClean.jsx";

export default function CrearServicio() {
  const navigate = useNavigate();
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [costo, setCosto] = useState(0);
  const [requierePago, setRequierePago] = useState(false);
  const [activo, setActivo] = useState(true);
  const [formularioFile, setFormularioFile] = useState(null);
  const [infoFile, setInfoFile] = useState(null);
  const [requisitosTexto, setRequisitosTexto] = useState("");
  const [campos, setCampos] = useState([]);
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  // Añadir campo dinámico
  const addCampo = () => setCampos(prev => [...prev, { nombre: "", etiqueta: "", tipo: "texto", requerido: false, opciones: [] }]);
  const updateCampo = (idx, field, value) => setCampos(prev => prev.map((c, i) => i === idx ? { ...c, [field]: value } : c));
  const removeCampo = (idx) => setCampos(prev => prev.filter((_, i) => i !== idx));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setEnviando(true);
    try {
      // 1. Crear el servicio
      const requisitos = requisitosTexto.split("\n").map(r => r.trim()).filter(r => r.length > 0);
      const rutaFormularioBase = formularioFile ? `/formularios/${formularioFile.name}` : null;
      const payload = {
        nombre,
        descripcion,
        costo: Number(costo) || 0,
        requierePago,
        activo,
        rutaFormularioBase,
        documentosRequeridos: requisitos,
      };
      const res = await api.post("/api/Servicios", payload);
      const servicioId = res.data.id ?? res.data.Id;
      // 2. Crear el formulario digital (campos)
      if (campos.length > 0 && servicioId) {
        const estructura = { campos: campos.map(c => ({
          nombre: c.nombre.trim(),
          etiqueta: c.etiqueta.trim() || c.nombre.trim(),
          tipo: c.tipo || "texto",
          requerido: !!c.requerido,
          opciones: c.tipo === "seleccion" ? (Array.isArray(c.opciones) ? c.opciones : (c.opciones || "").split("\n").map(o => o.trim()).filter(Boolean)) : undefined
        })).filter(c => c.nombre.length > 0) };
        await api.post("/api/FormulariosDigitales", {
          servicioId,
          estructuraJson: JSON.stringify(estructura)
        });
      }
      navigate("/admin/servicios");
    } catch (err) {
      setError("No se pudo crear el servicio. Verifica los datos e intenta de nuevo.");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="page">
      <BackButton fallback="/admin/servicios" />
      <h1>Crear nuevo servicio</h1>
      {error && <div className="login-error-banner">{error}</div>}
      <form onSubmit={handleSubmit} className="admin-form" style={{ maxWidth: 700 }}>
        <div className="form-group">
          <label>Nombre del servicio</label>
          <input value={nombre} onChange={e => setNombre(e.target.value)} required />
        </div>
        <div className="form-group">
          <label>Descripción corta</label>
          <textarea rows={2} value={descripcion} onChange={e => setDescripcion(e.target.value)} />
        </div>
        <div className="form-group">
          <label>Costo (DOP)</label>
          <input type="number" min="0" step="0.01" value={costo} onChange={e => setCosto(e.target.value)} />
        </div>
        <div className="form-group form-group-inline">
          <label className="checkbox-label">
            <input type="checkbox" checked={requierePago} onChange={e => setRequierePago(e.target.checked)} />
            <span>Requiere pago</span>
          </label>
        </div>
        <div className="form-group form-group-inline">
          <label className="checkbox-label">
            <input type="checkbox" checked={activo} onChange={e => setActivo(e.target.checked)} />
            <span>Servicio activo</span>
          </label>
        </div>
        <div className="form-group">
          <label>Formulario base (PDF)</label>
          <input type="file" accept="application/pdf" onChange={e => setFormularioFile(e.target.files[0] || null)} />
          <small>Por ahora solo se guardará el nombre del archivo como ruta base.</small>
        </div>
        <div className="form-group">
          <label>PDF de información del servicio (opcional)</label>
          <input type="file" accept="application/pdf" onChange={e => setInfoFile(e.target.files[0] || null)} />
          <small>Se añadirá como requisito “PDF informativo: nombreArchivo.pdf”.</small>
        </div>
        <div className="form-group">
          <label>Requisitos adicionales (uno por línea)</label>
          <textarea rows={4} placeholder={"Formulario LI-UPC-01 firmado\nRegistro Mercantil\nCopia de cédula del representante legal"} value={requisitosTexto} onChange={e => setRequisitosTexto(e.target.value)} />
        </div>
        <div className="form-group">
          <label>Campos del formulario digital</label>
          <button type="button" className="btn-outline" onClick={addCampo} style={{ marginBottom: 10 }}>+ Añadir campo</button>
          <ul style={{ marginTop: 8 }}>
            {campos.map((campo, idx) => (
              <li key={idx} style={{ marginBottom: 12 }}>
                <input placeholder="Nombre interno" value={campo.nombre} onChange={e => updateCampo(idx, "nombre", e.target.value)} style={{ marginRight: 8 }} />
                <input placeholder="Etiqueta visible" value={campo.etiqueta} onChange={e => updateCampo(idx, "etiqueta", e.target.value)} style={{ marginRight: 8 }} />
                <select value={campo.tipo} onChange={e => updateCampo(idx, "tipo", e.target.value)} style={{ marginRight: 8 }}>
                  <option value="texto">Texto</option>
                  <option value="checkbox">Checkbox</option>
                  <option value="seleccion">Selección</option>
                </select>
                {campo.tipo === "seleccion" && (
                  <textarea placeholder="Opciones (una por línea)" value={Array.isArray(campo.opciones) ? campo.opciones.join("\n") : (campo.opciones || "")} onChange={e => updateCampo(idx, "opciones", e.target.value.split("\n"))} style={{ marginRight: 8, verticalAlign: "middle" }} rows={2} />
                )}
                <label>
                  <input type="checkbox" checked={!!campo.requerido} onChange={e => updateCampo(idx, "requerido", e.target.checked)} style={{ marginLeft: 8 }} /> Requerido
                </label>
                <button type="button" onClick={() => removeCampo(idx)} style={{ color: "#ef4444", marginLeft: 8 }}>Eliminar</button>
              </li>
            ))}
          </ul>
        </div>
        <button type="submit" className="btn-primary" disabled={enviando}>{enviando ? "Guardando..." : "Crear servicio"}</button>
      </form>
    </div>
  );
}
