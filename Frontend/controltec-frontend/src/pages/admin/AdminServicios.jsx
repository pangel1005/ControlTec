// src/pages/admin/AdminServicios.jsx
import { useEffect, useState } from "react";
import api from "../../api/apiClient";

export default function AdminServicios() {
  const [servicios, setServicios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // servicio que estamos editando (null = creando)
  const [editingId, setEditingId] = useState(null);

  // campos del formulario
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [costo, setCosto] = useState(0);
  const [requierePago, setRequierePago] = useState(false);
  const [activo, setActivo] = useState(true);

  // archivos (solo guardamos el nombre / ruta, no subimos todavía)
  const [formularioFile, setFormularioFile] = useState(null);
  const [infoFile, setInfoFile] = useState(null);

  // requisitos (uno por línea)
  const [requisitosTexto, setRequisitosTexto] = useState("");

  const cargarServicios = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await api.get("/api/Servicios");
      setServicios(res.data || []);
    } catch (err) {
      console.error(err);
      setError("No se pudieron cargar los servicios.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarServicios();
  }, []);

  // Limpia el formulario para modo creación
  const resetForm = () => {
    setEditingId(null);
    setNombre("");
    setDescripcion("");
    setCosto(0);
    setRequierePago(false);
    setActivo(true);
    setFormularioFile(null);
    setInfoFile(null);
    setRequisitosTexto("");
  };

  // Cuando damos clic en "Editar"
  const startEdit = (servicio) => {
    setEditingId(servicio.id);
    setNombre(servicio.nombre || "");
    setDescripcion(servicio.descripcion || "");
    setCosto(servicio.costo ?? 0);
    setRequierePago(!!servicio.requierePago);
    setActivo(!!servicio.activo);
    setFormularioFile(null);
    setInfoFile(null);

    // documentosRequeridos viene como arreglo de objetos { id, nombre }
    if (servicio.documentosRequeridos && servicio.documentosRequeridos.length) {
      setRequisitosTexto(
        servicio.documentosRequeridos.map((r) => r.nombre).join("\n")
      );
    } else {
      setRequisitosTexto("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      setLoading(true);

      const requisitos = requisitosTexto
        .split("\n")
        .map((r) => r.trim())
        .filter((r) => r.length > 0);

      if (infoFile) {
        requisitos.push(`PDF informativo: ${infoFile.name}`);
      }

      const rutaFormularioBase = formularioFile
        ? `/formularios/${formularioFile.name}`
        : null;

      const payload = {
        nombre,
        descripcion,
        costo: Number(costo) || 0,
        requierePago,
        activo,
        rutaFormularioBase,
        documentosRequeridos: requisitos,
      };

      if (editingId) {
        // 👉 editar servicio existente
        await api.put(`/api/Servicios/${editingId}`, payload);
      } else {
        // 👉 crear nuevo servicio
        await api.post("/api/Servicios", payload);
      }

      resetForm();
      await cargarServicios();
    } catch (err) {
      console.error(err);
      setError("No se pudo guardar el servicio.");
    } finally {
      setLoading(false);
    }
  };

  const handleEliminarServicio = async (id) => {
    const confirmar = window.confirm(
      "¿Seguro que deseas eliminar este servicio? Esta acción no se puede deshacer."
    );
    if (!confirmar) return;

    try {
      setLoading(true);
      setError("");

      await api.delete(`/api/Servicios/${id}`);

      // si estabas editando ese mismo servicio, resetea el formulario
      if (editingId === id) {
        resetForm();
      }

      await cargarServicios();
    } catch (err) {
      console.error(err);
      setError("No se pudo eliminar el servicio.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <h1>Catálogo de Servicios y Requisitos</h1>
      <p>
        Configura los servicios y la lista de requisitos (incluyendo formulario
        PDF e información en PDF) que se usarán en las solicitudes.
      </p>

      {error && (
        <div className="login-error-banner" style={{ marginTop: "1rem" }}>
          {error}
        </div>
      )}

      <div className="admin-two-columns">
        {/* Columna izquierda: formulario CREAR / EDITAR */}
        <section className="admin-panel">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "0.75rem",
            }}
          >
            <h2>{editingId ? "Editar servicio" : "Crear servicio"}</h2>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                style={{
                  fontSize: "0.8rem",
                  borderRadius: "999px",
                  padding: "0.3rem 0.75rem",
                  border: "1px solid #bfdbfe",
                  background: "#eff6ff",
                  color: "#1d4ed8",
                  cursor: "pointer",
                }}
              >
                + Nuevo servicio
              </button>
            )}
          </div>

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

            {/* Checkbox más estético: requiere pago */}
            <div className="form-group form-group-inline">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={requierePago}
                  onChange={(e) => setRequierePago(e.target.checked)}
                />
                <span>Requiere pago</span>
              </label>
            </div>

            {/* Checkbox más estético: servicio activo */}
            <div className="form-group form-group-inline">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={activo}
                  onChange={(e) => setActivo(e.target.checked)}
                />
                <span>Servicio activo</span>
              </label>
            </div>

            <div className="form-group">
              <label>Formulario base (PDF)</label>
              <input
                type="file"
                accept="application/pdf"
                onChange={(e) => setFormularioFile(e.target.files[0] || null)}
              />
              <small>
                Por ahora solo se guardará el nombre del archivo como ruta base.
              </small>
            </div>

            <div className="form-group">
              <label>PDF de información del servicio (opcional)</label>
              <input
                type="file"
                accept="application/pdf"
                onChange={(e) => setInfoFile(e.target.files[0] || null)}
              />
              <small>
                Se añadirá como requisito “PDF informativo: nombreArchivo.pdf”.
              </small>
            </div>

            <div className="form-group">
              <label>Requisitos adicionales (uno por línea)</label>
              <textarea
                rows={4}
                placeholder={
                  "Formulario LI-UPC-01 firmado\nRegistro Mercantil\nCopia de cédula del representante legal"
                }
                value={requisitosTexto}
                onChange={(e) => setRequisitosTexto(e.target.value)}
              />
            </div>

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading
                ? "Guardando..."
                : editingId
                ? "Guardar cambios"
                : "Crear servicio"}
            </button>
          </form>
        </section>

        {/* Columna derecha: lista de servicios con acciones */}
        <section className="admin-panel">
          <h2>Servicios configurados</h2>

          {loading && <p>Cargando servicios...</p>}

          {!loading && servicios.length === 0 && (
            <p style={{ color: "#6b7280" }}>
              No hay servicios configurados aún.
            </p>
          )}

          {!loading && servicios.length > 0 && (
            <div className="service-list">
              {servicios.map((s) => (
                <div key={s.id} className="service-item">
                  <div className="service-main">
                    <div className="service-title">{s.nombre}</div>
                    <div className="service-description">
                      {s.descripcion}
                    </div>
                    <div className="service-meta">
                      <span>
                        <strong>Costo:</strong> {s.costo} DOP
                      </span>
                      <span>
                        <strong>Pago:</strong>{" "}
                        {s.requierePago ? "Requerido" : "No requerido"}
                      </span>
                      <span>
                        <strong>Activo:</strong> {s.activo ? "Sí" : "No"}
                      </span>
                    </div>
                  </div>

                  <div className="service-actions">
                    <button
                      type="button"
                      onClick={() => startEdit(s)}
                      className="service-btn-edit"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleEliminarServicio(s.id)}
                      className="service-btn-delete"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
