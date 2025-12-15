import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../api/apiClient";
import BackButton from "../../components/BackButtonClean.jsx";

const normalizarLista = (txt = "") =>
  txt
    .split("\n")
    .map((x) => x.trim())
    .filter(Boolean);

export default function EditarServicio() {
  const { id } = useParams();
  const servicioId = Number(id);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // campos
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [costo, setCosto] = useState(0);
  const [requierePago, setRequierePago] = useState(false);
  const [activo, setActivo] = useState(true);
  const [requisitosTexto, setRequisitosTexto] = useState("");

  // archivos (solo nombre/ruta)
  const [formularioFile, setFormularioFile] = useState(null);
  const [infoFile, setInfoFile] = useState(null);

  // Campos del formulario digital (misma sección visual que CrearServicio)
  const [campos, setCampos] = useState([]);

  // para sincronizar requisitos
  const [docsActuales, setDocsActuales] = useState([]); // [{id,nombre}]

  const requisitosPreview = useMemo(
    () => normalizarLista(requisitosTexto),
    [requisitosTexto]
  );

  // ===== Campos dinámicos (igual que CrearServicio) =====
  const addCampo = () =>
    setCampos((prev) => [
      ...prev,
      { nombre: "", etiqueta: "", tipo: "texto", requerido: false, opciones: [] },
    ]);

  const updateCampo = (idx, field, value) =>
    setCampos((prev) =>
      prev.map((c, i) => (i === idx ? { ...c, [field]: value } : c))
    );

  const removeCampo = (idx) =>
    setCampos((prev) => prev.filter((_, i) => i !== idx));

  const cargar = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await api.get(`/api/Servicios/${servicioId}`);
      const s = res.data;

      setNombre(s?.Nombre ?? s?.nombre ?? "");
      setDescripcion(s?.Descripcion ?? s?.descripcion ?? "");
      setCosto(s?.Costo ?? s?.costo ?? 0);
      setRequierePago(!!(s?.RequierePago ?? s?.requierePago));
      setActivo(!!(s?.Activo ?? s?.activo));

      const docs = s?.DocumentosRequeridos ?? s?.documentosRequeridos ?? [];
      setDocsActuales(docs);

      setRequisitosTexto(
        (docs || [])
          .map((d) => d.nombre ?? d.Nombre ?? "")
          .filter(Boolean)
          .join("\n")
      );

      // NOTA: file inputs no se pueden precargar
      setFormularioFile(null);
      setInfoFile(null);

      // Si tu backend tiene endpoint para traer estructura del formulario digital,
      // aquí lo cargaríamos. Por ahora: se queda como en tu pantalla (vacío).
      setCampos([]);
    } catch (err) {
      console.error(err);
      setError("No se pudo cargar el servicio.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!Number.isFinite(servicioId)) return;
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [servicioId]);

  // Sync requisitos usando endpoints del backend
  const sincronizarRequisitos = async (nuevosNombres) => {
    const existentes = (docsActuales || []).map((d) => ({
      id: d.id ?? d.Id,
      nombre: (d.nombre ?? d.Nombre ?? "").trim(),
    }));

    const setExist = new Set(existentes.map((x) => x.nombre));
    const setNew = new Set(
      (nuevosNombres || []).map((x) => x.trim()).filter(Boolean)
    );

    // 1) borrar los que ya no están
    const paraBorrar = existentes.filter(
      (x) => x.id && x.nombre && !setNew.has(x.nombre)
    );
    for (const d of paraBorrar) {
      await api.delete(
        `/api/Servicios/${servicioId}/documentos-requeridos/${d.id}`
      );
    }

    // 2) agregar los nuevos que faltan
    const paraAgregar = [...setNew].filter((n) => n && !setExist.has(n));
    for (const nombreDoc of paraAgregar) {
      await api.post(`/api/Servicios/${servicioId}/documentos-requeridos`, {
        nombre: nombreDoc,
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      setLoading(true);

      const reqs = [...requisitosPreview];
      if (infoFile) reqs.push(`PDF informativo: ${infoFile.name}`);

      const rutaFormularioBase = formularioFile
        ? `/formularios/${formularioFile.name}`
        : null;

      // 1) Actualizar datos básicos
      await api.put(`/api/Servicios/${servicioId}`, {
        nombre,
        descripcion,
        costo: Number(costo) || 0,
        requierePago,
        activo,
        rutaFormularioBase,
      });

      // 2) Sincronizar requisitos
      await sincronizarRequisitos(reqs);

      // 3) (Opcional futuro) actualizar formulario digital con "campos"
      // -> depende de tu endpoint real

      navigate("/admin/servicios");
    } catch (err) {
      console.error(err);
      setError("No se pudo guardar el servicio.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <BackButton fallback="/admin/servicios" />

      {/* ✅ MISMO TITULO + SUBTITULO que CrearServicio */}
      <h1>Editar servicio</h1>
      <p style={{ color: "#6b7280", marginTop: "-6px" }}>
        Completa los datos del servicio, requisitos y (opcional) estructura del formulario digital.
      </p>

      {error && <div className="login-error-banner">{error}</div>}

      {/* ✅ MISMO contenedor visual que CrearServicio */}
      <section className="admin-panel" style={{ maxWidth: 980, margin: "0 auto" }}>
        <form onSubmit={handleSubmit} className="admin-form">
          <div className="form-group">
            <label>Nombre del servicio</label>
            <input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Descripción corta</label>
            <textarea
              rows={2}
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
            />
          </div>

          {/* ✅ MISMO layout: costo a la izquierda, checks a la derecha */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 320px",
              gap: "24px",
              alignItems: "end",
            }}
          >
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

            <div style={{ display: "grid", gap: "10px" }}>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={requierePago}
                  onChange={(e) => setRequierePago(e.target.checked)}
                />
                <span>Requiere pago</span>
              </label>

              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={activo}
                  onChange={(e) => setActivo(e.target.checked)}
                />
                <span>Servicio activo</span>
              </label>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "24px",
              marginTop: "10px",
            }}
          >
            <div className="form-group">
              <label>Formulario base (PDF)</label>
              <input
                type="file"
                accept="application/pdf"
                onChange={(e) =>
                  setFormularioFile(e.target.files?.[0] || null)
                }
              />
              <small style={{ color: "#6b7280" }}>
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
              <small style={{ color: "#6b7280" }}>
                Se añadirá como requisito “PDF informativo: nombreArchivo.pdf”.
              </small>
            </div>
          </div>

          <div className="form-group">
            <label>Requisitos adicionales (uno por línea)</label>
            <textarea
              rows={4}
              value={requisitosTexto}
              onChange={(e) => setRequisitosTexto(e.target.value)}
            />
          </div>

          {/* ✅ MISMA SECCIÓN que CrearServicio */}
          <div style={{ marginTop: 24 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: "16px",
                alignItems: "center",
              }}
            >
              <div>
                <h2 style={{ margin: 0 }}>Campos del formulario digital</h2>
                <p style={{ margin: "6px 0 0", color: "#6b7280" }}>
                  Define los campos que llenará el solicitante en línea.
                </p>
              </div>

              <button
                type="button"
                className="btn-outline"
                onClick={addCampo}
              >
                + Añadir campo
              </button>
            </div>

            <div style={{ marginTop: 16 }}>
              {campos.length === 0 ? (
                <p style={{ color: "#6b7280", textAlign: "center", padding: "18px 0" }}>
                  No has agregado campos todavía.
                </p>
              ) : (
                <div style={{ display: "grid", gap: 12 }}>
                  {campos.map((campo, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr 170px 140px auto",
                        gap: 10,
                        alignItems: "center",
                      }}
                    >
                      <input
                        placeholder="Nombre interno"
                        value={campo.nombre}
                        onChange={(e) => updateCampo(idx, "nombre", e.target.value)}
                      />
                      <input
                        placeholder="Etiqueta visible"
                        value={campo.etiqueta}
                        onChange={(e) => updateCampo(idx, "etiqueta", e.target.value)}
                      />
                      <select
                        value={campo.tipo}
                        onChange={(e) => updateCampo(idx, "tipo", e.target.value)}
                      >
                        <option value="texto">Texto</option>
                        <option value="checkbox">Checkbox</option>
                        <option value="seleccion">Selección</option>
                      </select>

                      <label className="checkbox-label" style={{ justifyContent: "flex-start" }}>
                        <input
                          type="checkbox"
                          checked={!!campo.requerido}
                          onChange={(e) => updateCampo(idx, "requerido", e.target.checked)}
                        />
                        <span>Requerido</span>
                      </label>

                      <button
                        type="button"
                        onClick={() => removeCampo(idx)}
                        style={{
                          background: "transparent",
                          border: "1px solid #fecaca",
                          color: "#dc2626",
                          borderRadius: 8,
                          padding: "8px 12px",
                          cursor: "pointer",
                          fontWeight: 600,
                        }}
                      >
                        Eliminar
                      </button>

                      {campo.tipo === "seleccion" && (
                        <div style={{ gridColumn: "1 / -1" }}>
                          <textarea
                            rows={2}
                            placeholder="Opciones (una por línea)"
                            value={
                              Array.isArray(campo.opciones)
                                ? campo.opciones.join("\n")
                                : (campo.opciones || "")
                            }
                            onChange={(e) =>
                              updateCampo(idx, "opciones", e.target.value.split("\n"))
                            }
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ✅ MISMO footer: botones abajo derecha */}
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: "12px",
              marginTop: 24,
            }}
          >
            <button
              type="button"
              className="btn-outline"
              onClick={() => navigate("/admin/servicios")}
              disabled={loading}
            >
              Cancelar
            </button>

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
