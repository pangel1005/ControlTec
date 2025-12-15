// src/pages/admin/AdminGestionServicios.jsx
import { useEffect, useState } from "react";
import api from "../../api/apiClient";
import BackButton from "../../components/BackButtonClean.jsx";
import { useNavigate } from "react-router-dom";

export default function AdminGestionServicios() {
  const [servicios, setServicios] = useState([]);
  const [servicioSeleccionado, setServicioSeleccionado] = useState(null);
  const [subservicios, setSubservicios] = useState([]);
  const [subservicioSeleccionado, setSubservicioSeleccionado] = useState(null);
  const [campos, setCampos] = useState([]);
  const [formularioId, setFormularioId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Cargar todos los servicios
  useEffect(() => {
    setLoading(true);
    api.get("/api/Servicios")
      .then(res => setServicios(res.data || []))
      .catch(() => setError("No se pudieron cargar los servicios."))
      .finally(() => setLoading(false));
  }, []);

  // Cargar subservicios y formulario cuando se selecciona un servicio
  useEffect(() => {
    if (!servicioSeleccionado) {
      setSubservicios([]);
      setSubservicioSeleccionado(null);
      setCampos([]);
      setFormularioId(null);
      return;
    }
    setLoading(true);
    api.get(`/api/Subservicios?servicioId=${servicioSeleccionado.id ?? servicioSeleccionado.Id}`)
      .then(res => setSubservicios(res.data || []))
      .catch(() => setError("No se pudieron cargar los subservicios."))
      .finally(() => setLoading(false));
  }, [servicioSeleccionado]);

  // Cargar campos del formulario digital cuando se selecciona un subservicio
  useEffect(() => {
    if (!subservicioSeleccionado) {
      setCampos([]);
      setFormularioId(null);
      return;
    }
    setLoading(true);
    api.get(`/api/FormulariosDigitales/subservicio/${subservicioSeleccionado.id ?? subservicioSeleccionado.Id}`)
      .then(res => {
        if (res.data && res.data.estructuraJson) {
          setFormularioId(res.data.id ?? res.data.Id);
          try {
            const parsed = JSON.parse(res.data.estructuraJson);
            setCampos(parsed.campos || parsed.fields || []);
          } catch {
            setCampos([]);
          }
        } else {
          setFormularioId(null);
          setCampos([]);
        }
      })
      .catch(() => setCampos([]))
      .finally(() => setLoading(false));
  }, [subservicioSeleccionado]);

  // CRUD de servicios
  // ... (puedes copiar la lógica de crear/editar/eliminar de tu AdminServicios.jsx)

  // CRUD de subservicios
  // ... (puedes copiar la lógica de crear/editar/eliminar de tu AdminServicioConfig.jsx)

  // CRUD de campos del formulario digital
  const addCampo = () => {
    setCampos(prev => [
      ...prev,
      { nombre: "", etiqueta: "", tipo: "texto", requerido: false, opciones: [] }
    ]);
  };
  const updateCampo = (idx, field, value) => {
    setCampos(prev => prev.map((c, i) => i === idx ? { ...c, [field]: value } : c));
  };
  const removeCampo = (idx) => {
    setCampos(prev => prev.filter((_, i) => i !== idx));
  };
  const guardarCampos = async () => {
    if (!subservicioSeleccionado) return;
    const camposLimpios = campos.map(c => ({
      nombre: c.nombre.trim(),
      etiqueta: c.etiqueta.trim() || c.nombre.trim(),
      tipo: c.tipo || "texto",
      requerido: !!c.requerido,
      opciones: c.tipo === "seleccion" ? (Array.isArray(c.opciones) ? c.opciones : (c.opciones || "").split("\n").map(o => o.trim()).filter(Boolean)) : undefined
    })).filter(c => c.nombre.length > 0);
    const estructura = { campos: camposLimpios };
    const payload = {
      subservicioId: subservicioSeleccionado.id ?? subservicioSeleccionado.Id,
      estructuraJson: JSON.stringify(estructura)
    };
    setLoading(true);
    try {
      if (formularioId) {
        await api.put(`/api/FormulariosDigitales/${formularioId}`, { id: formularioId, ...payload });
      } else {
        await api.post(`/api/FormulariosDigitales`, payload);
      }
    } catch {
      setError("No se pudo guardar el formulario digital.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <BackButton fallback="/admin" />
      <h1>Gestión avanzada de servicios y formularios</h1>
      {error && <div className="login-error-banner">{error}</div>}
      <div style={{ display: "flex", gap: 32 }}>
        {/* Panel de servicios */}
        <section style={{ minWidth: 260 }}>
          <h2>Servicios</h2>
          <ul>
            {servicios.map(s => (
              <li key={s.id ?? s.Id}>
                <button type="button" onClick={() => setServicioSeleccionado(s)} style={{ fontWeight: servicioSeleccionado && (s.id ?? s.Id) === (servicioSeleccionado.id ?? servicioSeleccionado.Id) ? "bold" : "normal" }}>
                  {s.nombre ?? s.Nombre}
                </button>
              </li>
            ))}
          </ul>
          {/* Aquí puedes poner crear/editar/eliminar servicios */}
        </section>
        {/* Panel de subservicios */}
        <section style={{ minWidth: 260 }}>
          <h2>Subservicios</h2>
          {subservicios.length === 0 && <p style={{ color: "#6b7280" }}>Selecciona un servicio para ver sus subservicios.</p>}
          <ul>
            {subservicios.map(sub => (
              <li key={sub.id ?? sub.Id}>
                <button type="button" onClick={() => setSubservicioSeleccionado(sub)} style={{ fontWeight: subservicioSeleccionado && (sub.id ?? sub.Id) === (subservicioSeleccionado.id ?? subservicioSeleccionado.Id) ? "bold" : "normal" }}>
                  {sub.nombre ?? sub.Nombre}
                </button>
              </li>
            ))}
          </ul>
          {/* Aquí puedes poner crear/editar/eliminar subservicios */}
        </section>
        {/* Panel de campos del formulario */}
        <section style={{ flex: 1 }}>
          <h2>Campos del formulario digital</h2>
          {subservicioSeleccionado ? (
            <>
              <button type="button" onClick={addCampo} className="btn-outline">+ Añadir campo</button>
              <ul style={{ marginTop: 16 }}>
                {campos.map((campo, idx) => (
                  <li key={idx} style={{ marginBottom: 12 }}>
                    <input
                      placeholder="Nombre interno"
                      value={campo.nombre}
                      onChange={e => updateCampo(idx, "nombre", e.target.value)}
                      style={{ marginRight: 8 }}
                    />
                    <input
                      placeholder="Etiqueta visible"
                      value={campo.etiqueta}
                      onChange={e => updateCampo(idx, "etiqueta", e.target.value)}
                      style={{ marginRight: 8 }}
                    />
                    <select value={campo.tipo} onChange={e => updateCampo(idx, "tipo", e.target.value)} style={{ marginRight: 8 }}>
                      <option value="texto">Texto</option>
                      <option value="checkbox">Checkbox</option>
                      <option value="seleccion">Selección</option>
                    </select>
                    {campo.tipo === "seleccion" && (
                      <textarea
                        placeholder="Opciones (una por línea)"
                        value={Array.isArray(campo.opciones) ? campo.opciones.join("\n") : (campo.opciones || "")}
                        onChange={e => updateCampo(idx, "opciones", e.target.value.split("\n"))}
                        style={{ marginRight: 8, verticalAlign: "middle" }}
                        rows={2}
                      />
                    )}
                    <label>
                      <input
                        type="checkbox"
                        checked={!!campo.requerido}
                        onChange={e => updateCampo(idx, "requerido", e.target.checked)}
                        style={{ marginLeft: 8 }}
                      /> Requerido
                    </label>
                    <button type="button" onClick={() => removeCampo(idx)} style={{ color: "#ef4444", marginLeft: 8 }}>Eliminar</button>
                  </li>
                ))}
              </ul>
              <button type="button" className="btn-primary" onClick={guardarCampos} style={{ marginTop: 16 }}>Guardar cambios</button>
            </>
          ) : <p style={{ color: "#6b7280" }}>Selecciona un subservicio para ver o editar los campos del formulario digital.</p>}
        </section>
      </div>
    </div>
  );
}
