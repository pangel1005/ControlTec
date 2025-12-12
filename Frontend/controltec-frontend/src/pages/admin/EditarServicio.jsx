// src/pages/admin/EditarServicio.jsx
import { useEffect, useState } from "react";
import api from "../../api/apiClient";
import { useNavigate, useParams } from "react-router-dom";
import BackButton from "../../components/BackButtonClean.jsx";

export default function EditarServicio() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  // Campos del servicio
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [costo, setCosto] = useState(0);
  const [requierePago, setRequierePago] = useState(false);
  const [activo, setActivo] = useState(true);
  const [requisitosTexto, setRequisitosTexto] = useState("");
  const [campos, setCampos] = useState([]);

  useEffect(() => {
    setLoading(true);
    async function cargar() {
      try {
        // 1. Servicio
        const res = await api.get(`/api/Servicios/${id}`);
        const s = res.data;
        setNombre(s.nombre || "");
        setDescripcion(s.descripcion || "");
        setCosto(s.costo ?? 0);
        setRequierePago(!!s.requierePago);
        setActivo(!!s.activo);
        setRequisitosTexto((s.documentosRequeridos || []).map(r => r.nombre || r).join("\n"));
        // 2. Subservicios
        const subsRes = await api.get(`/api/Subservicios?servicioId=${id}`);
        const subservicios = subsRes.data || [];
        if (subservicios.length > 0) {
          const subId = subservicios[0].id ?? subservicios[0].Id;
          const formRes = await api.get(`/api/FormulariosDigitales/subservicio/${subId}`);
          if (formRes.data && formRes.data.estructuraJson) {
            try {
              const parsed = JSON.parse(formRes.data.estructuraJson);
              setCampos(parsed.campos || parsed.fields || []);
            } catch { setCampos([]); }
          } else {
            setCampos([]);
          }
        } else {
          setCampos([]);
        }
      } catch {
        setError("No se pudo cargar el servicio.");
      } finally {
        setLoading(false);
      }
    }
    cargar();
  }, [id]);

  // CRUD campos dinámicos
  const addCampo = () => setCampos(prev => [...prev, { nombre: "", etiqueta: "", tipo: "texto", requerido: false, opciones: [] }]);
  const updateCampo = (idx, field, value) => setCampos(prev => prev.map((c, i) => i === idx ? { ...c, [field]: value } : c));
  const removeCampo = (idx) => setCampos(prev => prev.filter((_, i) => i !== idx));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setEnviando(true);
    try {
      // 1. Actualizar servicio
      const requisitos = requisitosTexto.split("\n").map(r => r.trim()).filter(r => r.length > 0);
      const payload = {
        nombre,
        descripcion,
        costo: Number(costo) || 0,
        requierePago,
        activo,
        documentosRequeridos: requisitos,
      };
      await api.put(`/api/Servicios/${id}`, payload);
      // 2. Actualizar formulario digital
      if (campos.length > 0) {
        const estructura = { campos: campos.map(c => ({
          nombre: c.nombre.trim(),
          etiqueta: c.etiqueta.trim() || c.nombre.trim(),
          tipo: c.tipo || "texto",
          requerido: !!c.requerido,
          opciones: c.tipo === "seleccion" ? (Array.isArray(c.opciones) ? c.opciones : (c.opciones || "").split("\n").map(o => o.trim()).filter(Boolean)) : undefined
        })).filter(c => c.nombre.length > 0) };
        await api.put(`/api/FormulariosDigitales/servicio/${id}`, {
          servicioId: id,
          estructuraJson: JSON.stringify(estructura)
        });
      }
      navigate("/admin/servicios");
    } catch (err) {
      setError("No se pudo guardar los cambios. Verifica los datos e intenta de nuevo.");
    } finally {
      setEnviando(false);
    }
  };

  if (loading) return <p>Cargando servicio...</p>;

  return (
    <div className="page">
      <BackButton fallback="/admin/servicios" />
      <h1>Editar servicio</h1>
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
          <label>Requisitos adicionales (uno por línea)</label>
          <textarea rows={4} value={requisitosTexto} onChange={e => setRequisitosTexto(e.target.value)} />
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
        <div style={{ display: 'flex', gap: 16, marginTop: 24 }}>
          <button type="button" className="btn-outline" onClick={() => navigate('/admin/servicios')}>Cancelar</button>
          <button type="submit" className="btn-primary" disabled={enviando}>{enviando ? "Guardando..." : "Guardar cambios"}</button>
        </div>
      </form>
    </div>
  );
}
