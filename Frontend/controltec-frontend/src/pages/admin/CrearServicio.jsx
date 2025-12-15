// src/pages/admin/CrearServicio.jsx
import { useEffect, useMemo, useState } from "react";
import api from "../../api/apiClient";
import { useNavigate, useParams } from "react-router-dom";
import BackButton from "../../components/BackButtonClean.jsx";

export default function CrearServicio() {
  const navigate = useNavigate();
  const { id } = useParams(); // ✅ si viene, estamos editando
  const editingId = useMemo(() => (id ? Number(id) : null), [id]);

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
  const [cargando, setCargando] = useState(false);

  // Añadir campo dinámico
  const addCampo = () =>
    setCampos((prev) => [
      ...prev,
      { nombre: "", etiqueta: "", tipo: "texto", requerido: false, opciones: [] },
    ]);

  const updateCampo = (idx, field, value) =>
    setCampos((prev) => prev.map((c, i) => (i === idx ? { ...c, [field]: value } : c)));

  const removeCampo = (idx) =>
    setCampos((prev) => prev.filter((_, i) => i !== idx));

  // ✅ Cargar servicio si es edición
  useEffect(() => {
    let cancelado = false;

    async function cargarParaEditar() {
      if (!editingId) return;

      setCargando(true);
      setError("");
      try {
        const res = await api.get(`/api/Servicios/${editingId}`);
        const s = res.data;

        if (cancelado) return;

        setNombre(s.nombre ?? s.Nombre ?? "");
        setDescripcion(s.descripcion ?? s.Descripcion ?? "");
        setCosto(s.costo ?? s.Costo ?? 0);
        setRequierePago(!!(s.requierePago ?? s.RequierePago));
        setActivo(!!(s.activo ?? s.Activo));

        // requisitos (si backend manda objetos o strings)
        const docs = s.documentosRequeridos ?? s.DocumentosRequeridos ?? [];
        if (Array.isArray(docs) && docs.length > 0) {
          const names = docs.map((r) => (typeof r === "string" ? r : r?.nombre ?? r?.Nombre)).filter(Boolean);
          setRequisitosTexto(names.join("\n"));
        } else {
          setRequisitosTexto("");
        }

        // NOTA: no subimos archivos aún, por eso dejamos file inputs en null
        setFormularioFile(null);
        setInfoFile(null);

        // ✅ intentar cargar formulario digital si existe (opcional)
        // Si no tienes endpoint por servicio, lo dejamos vacío sin romper.
        try {
          const fd = await api.get(`/api/FormulariosDigitales/servicio/${editingId}`);
          const estructuraJson = fd.data?.estructuraJson ?? fd.data?.EstructuraJson;
          if (estructuraJson) {
            const estructura = JSON.parse(estructuraJson);
            const lista = Array.isArray(estructura?.campos) ? estructura.campos : [];
            setCampos(
              lista.map((c) => ({
                nombre: c.nombre ?? "",
                etiqueta: c.etiqueta ?? "",
                tipo: c.tipo ?? "texto",
                requerido: !!c.requerido,
                opciones: c.opciones ?? [],
              }))
            );
          }
        } catch {
          // si no existe endpoint o no hay formulario, ignoramos
          setCampos([]);
        }
      } catch (e) {
        console.error(e);
        setError("No se pudo cargar el servicio para editar.");
      } finally {
        if (!cancelado) setCargando(false);
      }
    }

    cargarParaEditar();
    return () => {
      cancelado = true;
    };
  }, [editingId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setEnviando(true);

    try {
      const requisitos = requisitosTexto
        .split("\n")
        .map((r) => r.trim())
        .filter((r) => r.length > 0);

      if (infoFile) {
        requisitos.push(`PDF informativo: ${infoFile.name}`);
      }

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

      let servicioId = editingId;

      // ✅ Crear o actualizar servicio
      if (editingId) {
        await api.put(`/api/Servicios/${editingId}`, payload);
      } else {
        const res = await api.post("/api/Servicios", payload);
        servicioId = res.data?.id ?? res.data?.Id;
      }

      // ✅ Crear/actualizar formulario digital (si hay campos)
      if (campos.length > 0 && servicioId) {
        const estructura = {
          campos: campos
            .map((c) => ({
              nombre: (c.nombre || "").trim(),
              etiqueta: (c.etiqueta || "").trim() || (c.nombre || "").trim(),
              tipo: c.tipo || "texto",
              requerido: !!c.requerido,
              opciones:
                c.tipo === "seleccion"
                  ? Array.isArray(c.opciones)
                    ? c.opciones
                    : String(c.opciones || "")
                        .split("\n")
                        .map((o) => o.trim())
                        .filter(Boolean)
                  : undefined,
            }))
            .filter((c) => c.nombre.length > 0),
        };

        // Si tienes update endpoint, úsalo; si no, crea.
        // Aquí intentamos primero PUT; si falla, hacemos POST.
        try {
          await api.put(`/api/FormulariosDigitales/servicio/${servicioId}`, {
            servicioId,
            estructuraJson: JSON.stringify(estructura),
          });
        } catch {
          await api.post("/api/FormulariosDigitales", {
            servicioId,
            estructuraJson: JSON.stringify(estructura),
          });
        }
      }

      navigate("/admin/servicios");
    } catch (err) {
      console.error(err);
      setError("No se pudo guardar el servicio. Verifica los datos e intenta de nuevo.");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="ct-app">
      <div className="ct-page-container">
        <header className="ct-header">
          <div className="ct-title-group">
            <div className="ct-row" style={{ gap: "0.75rem", alignItems: "center" }}>
              <BackButton fallback="/admin/servicios" />
              <h1 className="ct-title" style={{ margin: 0 }}>
                {editingId ? "Editar servicio" : "Crear nuevo servicio"}
              </h1>
            </div>
            <p className="ct-subtitle">
              Completa los datos del servicio, requisitos y (opcional) estructura del formulario digital.
            </p>
          </div>
        </header>

        {error && <div className="ct-error">{error}</div>}
        {cargando && <div className="ct-loading">Cargando servicio...</div>}

        {!cargando && (
          <section className="ct-card" style={{ maxWidth: 920, margin: "0 auto" }}>
            <form onSubmit={handleSubmit} className="ct-col" style={{ gap: "1rem" }}>
              <div className="form-group">
                <label>Nombre del servicio</label>
                <input value={nombre} onChange={(e) => setNombre(e.target.value)} required />
              </div>

              <div className="form-group">
                <label>Descripción corta</label>
                <textarea
                  rows={3}
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                />
              </div>

              <div className="ct-grid-2">
                <div className="form-group">
                  <label>Costo (DOP)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={costo}
                    onChange={(e) => setCosto(e.target.value)}
                  />
                </div>

                <div className="ct-col" style={{ gap: "0.75rem", paddingTop: "0.25rem" }}>
                  <label className="checkbox-label" style={{ display: "flex", gap: "0.5rem" }}>
                    <input
                      type="checkbox"
                      checked={requierePago}
                      onChange={(e) => setRequierePago(e.target.checked)}
                    />
                    <span>Requiere pago</span>
                  </label>

                  <label className="checkbox-label" style={{ display: "flex", gap: "0.5rem" }}>
                    <input
                      type="checkbox"
                      checked={activo}
                      onChange={(e) => setActivo(e.target.checked)}
                    />
                    <span>Servicio activo</span>
                  </label>
                </div>
              </div>

              <div className="ct-grid-2">
                <div className="form-group">
                  <label>Formulario base (PDF)</label>
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={(e) => setFormularioFile(e.target.files?.[0] || null)}
                  />
                  <small style={{ color: "var(--ct-text-muted)" }}>
                    Por ahora solo se guardará el nombre del archivo como ruta base.
                  </small>
                </div>

                <div className="form-group">
                  <label>PDF de información del servicio (opcional)</label>
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={(e) => setInfoFile(e.target.files?.[0] || null)}
                  />
                  <small style={{ color: "var(--ct-text-muted)" }}>
                    Se añadirá como requisito “PDF informativo: nombreArchivo.pdf”.
                  </small>
                </div>
              </div>

              <div className="form-group">
                <label>Requisitos adicionales (uno por línea)</label>
                <textarea
                  rows={5}
                  placeholder={
                    "Formulario LI-UPC-01 firmado\nRegistro Mercantil\nCopia de cédula del representante legal"
                  }
                  value={requisitosTexto}
                  onChange={(e) => setRequisitosTexto(e.target.value)}
                />
              </div>

              <div className="ct-card" style={{ padding: "1rem" }}>
                <div className="ct-row-between ct-wrap" style={{ gap: "1rem" }}>
                  <div>
                    <h2 style={{ margin: 0 }}>Campos del formulario digital</h2>
                    <p style={{ margin: "0.25rem 0 0", color: "var(--ct-text-muted)" }}>
                      Define los campos que llenará el solicitante en línea.
                    </p>
                  </div>

                  <button type="button" className="ct-btn ct-btn-outline" onClick={addCampo}>
                    + Añadir campo
                  </button>
                </div>

                {campos.length === 0 ? (
                  <div className="ct-empty" style={{ marginTop: "0.75rem" }}>
                    No has agregado campos todavía.
                  </div>
                ) : (
                  <div className="ct-col" style={{ marginTop: "0.75rem", gap: "0.75rem" }}>
                    {campos.map((campo, idx) => (
                      <div key={idx} className="ct-card" style={{ padding: "0.9rem" }}>
                        <div className="ct-grid-2" style={{ gap: "0.75rem" }}>
                          <div className="form-group">
                            <label>Nombre interno</label>
                            <input
                              value={campo.nombre}
                              onChange={(e) => updateCampo(idx, "nombre", e.target.value)}
                              placeholder="ej: numeroRegistro"
                            />
                          </div>

                          <div className="form-group">
                            <label>Etiqueta visible</label>
                            <input
                              value={campo.etiqueta}
                              onChange={(e) => updateCampo(idx, "etiqueta", e.target.value)}
                              placeholder="ej: Número de registro"
                            />
                          </div>

                          <div className="form-group">
                            <label>Tipo</label>
                            <select
                              value={campo.tipo}
                              onChange={(e) => updateCampo(idx, "tipo", e.target.value)}
                            >
                              <option value="texto">Texto</option>
                              <option value="checkbox">Checkbox</option>
                              <option value="seleccion">Selección</option>
                            </select>
                          </div>

                          <div className="form-group" style={{ paddingTop: "1.55rem" }}>
                            <label className="checkbox-label" style={{ display: "flex", gap: "0.5rem" }}>
                              <input
                                type="checkbox"
                                checked={!!campo.requerido}
                                onChange={(e) => updateCampo(idx, "requerido", e.target.checked)}
                              />
                              <span>Requerido</span>
                            </label>
                          </div>
                        </div>

                        {campo.tipo === "seleccion" && (
                          <div className="form-group" style={{ marginTop: "0.75rem" }}>
                            <label>Opciones (una por línea)</label>
                            <textarea
                              rows={2}
                              value={
                                Array.isArray(campo.opciones)
                                  ? campo.opciones.join("\n")
                                  : String(campo.opciones || "")
                              }
                              onChange={(e) => updateCampo(idx, "opciones", e.target.value.split("\n"))}
                              placeholder={"Opción 1\nOpción 2\nOpción 3"}
                            />
                          </div>
                        )}

                        <div className="ct-row" style={{ justifyContent: "flex-end", marginTop: "0.75rem" }}>
                          <button
                            type="button"
                            className="ct-btn ct-btn-outline"
                            style={{ borderColor: "#fecaca", color: "#b91c1c" }}
                            onClick={() => removeCampo(idx)}
                          >
                            Eliminar campo
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="ct-row" style={{ justifyContent: "flex-end", gap: "0.75rem" }}>
                <button
                  type="button"
                  className="ct-btn ct-btn-outline"
                  onClick={() => navigate("/admin/servicios")}
                  disabled={enviando}
                >
                  Cancelar
                </button>

                <button type="submit" className="ct-btn ct-btn-primary" disabled={enviando}>
                  {enviando ? "Guardando..." : editingId ? "Guardar cambios" : "Crear servicio"}
                </button>
              </div>
            </form>
          </section>
        )}
      </div>
    </div>
  );
}
