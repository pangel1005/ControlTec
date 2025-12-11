// src/pages/admin/AdminServicioConfig.jsx
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../api/apiClient";
import BackButton from "../../components/BackButtonClean.jsx";

export default function AdminServicioConfig() {
  const { id } = useParams();
  const servicioId = Number(id);
  const navigate = useNavigate();

  const [servicio, setServicio] = useState(null);
  const [subservicios, setSubservicios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Formulario de subservicio (crear/editar)
  const [editingSubId, setEditingSubId] = useState(null);
  const [subNombre, setSubNombre] = useState("");
  const [subDescripcion, setSubDescripcion] = useState("");
  const [subRutaFormularioBase, setSubRutaFormularioBase] = useState("");
  const [subActivo, setSubActivo] = useState(true);

  // Selección para configurar formulario digital
  const [selectedSubservicioId, setSelectedSubservicioId] = useState(null);

  // Constructor de formulario digital
  const [formCampos, setFormCampos] = useState([]);
  const [formularioId, setFormularioId] = useState(null);
  const [loadingFormulario, setLoadingFormulario] = useState(false);
  const [errorFormulario, setErrorFormulario] = useState("");

  useEffect(() => {
    const cargar = async () => {
      setLoading(true);
      setError("");
      try {
        const [servRes, subRes] = await Promise.all([
          api.get(`/api/Servicios/${servicioId}`),
          api.get(`/api/Subservicios`, {
            params: { servicioId },
          }),
        ]);

        setServicio(servRes.data || null);
        const listaSub = subRes.data || [];
        setSubservicios(listaSub);

        if (!selectedSubservicioId && listaSub.length > 0) {
          const firstId = listaSub[0].id ?? listaSub[0].Id;
          if (firstId) {
            setSelectedSubservicioId(firstId);
          }
        }
      } catch (err) {
        setError("No se pudo cargar la información del servicio.");
      } finally {
        setLoading(false);
      }
    };

    if (!Number.isNaN(servicioId)) {
      cargar();
    }
  }, [servicioId]);

  useEffect(() => {
    if (selectedSubservicioId) {
      cargarFormularioDigital(selectedSubservicioId);
    } else {
      setFormularioId(null);
      setFormCampos([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSubservicioId]);

  const recargarSubservicios = async () => {
    try {
      const res = await api.get(`/api/Subservicios`, {
        params: { servicioId },
      });
      const lista = res.data || [];
      setSubservicios(lista);
      if (lista.length > 0 && !selectedSubservicioId) {
        const firstId = lista[0].id ?? lista[0].Id;
        if (firstId) {
          setSelectedSubservicioId(firstId);
        }
      }
    } catch (err) {
      setError("No se pudieron recargar los subservicios.");
    }
  };

  const resetSubForm = () => {
    setEditingSubId(null);
    setSubNombre("");
    setSubDescripcion("");
    setSubRutaFormularioBase("");
    setSubActivo(true);
  };

  const startEditSubservicio = (sub) => {
    setEditingSubId(sub.id ?? sub.Id);
    setSubNombre(sub.nombre ?? sub.Nombre ?? "");
    setSubDescripcion(sub.descripcion ?? sub.Descripcion ?? "");
    setSubRutaFormularioBase(
      sub.rutaFormularioBase ?? sub.RutaFormularioBase ?? ""
    );
    setSubActivo(sub.activo ?? sub.Activo ?? true);
  };

  const handleSubmitSubservicio = async (e) => {
    e.preventDefault();

    if (!subNombre.trim()) {
      alert("El nombre del subservicio es obligatorio.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const payload = {
        id: editingSubId ?? 0,
        nombre: subNombre.trim(),
        descripcion: subDescripcion.trim(),
        servicioId,
        rutaFormularioBase: subRutaFormularioBase || null,
        activo: subActivo,
      };

      if (editingSubId) {
        await api.put(`/api/Subservicios/${editingSubId}`, payload);
      } else {
        await api.post(`/api/Subservicios`, payload);
      }

      resetSubForm();
      await recargarSubservicios();
    } catch (err) {
      setError("No se pudo guardar el subservicio.");
    } finally {
      setLoading(false);
    }
  };

  const handleEliminarSubservicio = async (subId) => {
    const confirmar = window.confirm(
      "¿Seguro que deseas desactivar este subservicio?"
    );
    if (!confirmar) return;

    try {
      setLoading(true);
      setError("");
      await api.delete(`/api/Subservicios/${subId}`);

      if (selectedSubservicioId === subId) {
        setSelectedSubservicioId(null);
        setFormularioId(null);
        setFormCampos([]);
      }

      await recargarSubservicios();
    } catch (err) {
      setError("No se pudo desactivar el subservicio.");
    } finally {
      setLoading(false);
    }
  };

  const cargarFormularioDigital = async (subId) => {
    setLoadingFormulario(true);
    setErrorFormulario("");
    setFormCampos([]);
    setFormularioId(null);

    try {
      const res = await api.get(
        `/api/FormulariosDigitales/subservicio/${subId}`
      );
      const form = res.data || null;
      if (!form) {
        return;
      }

      const rawJson = form.estructuraJson || form.EstructuraJson;
      let campos = [];

      if (rawJson) {
        try {
          const parsed = JSON.parse(rawJson);
          const arr = parsed.campos || parsed.fields || parsed;
          if (Array.isArray(arr)) {
            campos = arr.map((c) => ({
              nombre: c.nombre || "",
              etiqueta: c.etiqueta || c.nombre || "",
              tipo: c.tipo || "texto",
              requerido: !!c.requerido,
              opcionesTexto: Array.isArray(c.opciones)
                ? c.opciones.join("\n")
                : "",
            }));
          }
        } catch (parseErr) {
          // Error de parseo, ignora
        }
      }

      setFormularioId(form.id ?? form.Id);
      setFormCampos(campos);
    } catch (err) {
      if (err.response?.status === 404) {
        setFormularioId(null);
        setFormCampos([]);
      } else {
        setErrorFormulario("No se pudo cargar el formulario digital de este subservicio.");
      }
    } finally {
      setLoadingFormulario(false);
    }
  };

  const addCampo = () => {
    setFormCampos((prev) => [
      ...prev,
      {
        nombre: "",
        etiqueta: "",
        tipo: "texto",
        requerido: false,
        opcionesTexto: "",
      },
    ]);
  };

  const updateCampo = (index, field, value) => {
    setFormCampos((prev) =>
      prev.map((c, i) => (i === index ? { ...c, [field]: value } : c))
    );
  };

  const removeCampo = (index) => {
    setFormCampos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleGuardarFormulario = async (e) => {
    e.preventDefault();

    if (!selectedSubservicioId) {
      alert("Selecciona un subservicio para configurar su formulario.");
      return;
    }

    const camposLimpios = formCampos
      .map((c) => ({
        nombre: c.nombre.trim(),
        etiqueta: c.etiqueta.trim() || c.nombre.trim(),
        tipo: c.tipo || "texto",
        requerido: !!c.requerido,
        opciones:
          c.tipo === "seleccion"
            ? c.opcionesTexto
                .split("\n")
                .map((o) => o.trim())
                .filter((o) => o.length > 0)
            : undefined,
      }))
      .filter((c) => c.nombre.length > 0);

    if (camposLimpios.length === 0) {
      alert("Agrega al menos un campo al formulario.");
      return;
    }

    const estructura = {
      campos: camposLimpios,
    };

    const payload = {
      subservicioId: selectedSubservicioId,
      estructuraJson: JSON.stringify(estructura),
    };

    try {
      setLoadingFormulario(true);
      setErrorFormulario("");

      if (formularioId) {
        await api.put(`/api/FormulariosDigitales/${formularioId}`, {
          id: formularioId,
          ...payload,
        });
      } else {
        const res = await api.post(`/api/FormulariosDigitales`, payload);
        const nuevoId = res.data?.id ?? res.data?.Id;
        if (nuevoId) {
          setFormularioId(nuevoId);
        }
      }

      alert("Formulario digital guardado correctamente.");
    } catch (err) {
      setErrorFormulario("No se pudo guardar el formulario digital.");
    } finally {
      setLoadingFormulario(false);
    }
  };

  const handleEliminarFormulario = async () => {
    if (!formularioId) return;
    const confirmar = window.confirm(
      "¿Seguro que deseas eliminar el formulario digital de este subservicio?"
    );
    if (!confirmar) return;

    try {
      setLoadingFormulario(true);
      setErrorFormulario("");
      await api.delete(`/api/FormulariosDigitales/${formularioId}`);
      setFormularioId(null);
      setFormCampos([]);
    } catch (err) {
      setErrorFormulario("No se pudo eliminar el formulario digital.");
    } finally {
      setLoadingFormulario(false);
    }
  };

  if (loading && !servicio) {
    return (
      <div className="page">
        <BackButton />
        <p>Cargando configuración del servicio...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page">
        <BackButton />
        <p className="login-error">{error}</p>
      </div>
    );
  }

  if (!servicio) {
    return (
      <div className="page">
        <BackButton />
        <p>No se encontró la información del servicio.</p>
      </div>
    );
  }

  return (
    <div className="page">
      <BackButton fallback="/admin/servicios" />

      <h1>Configurar servicio</h1>
      <p>
        Servicio: <strong>{servicio.nombre ?? servicio.Nombre}</strong>
      </p>
      <p style={{ maxWidth: "720px", color: "#4b5563" }}>
        Desde aquí puedes gestionar los subservicios de este servicio y definir
        el formulario digital (campos) que deberá completar el solicitante.
      </p>

      <div className="admin-two-columns" style={{ marginTop: "1.5rem" }}>
        {/* Columna izquierda: subservicios */}
        <section className="admin-panel">
          <h2>Subservicios</h2>

          {subservicios.length === 0 && (
            <p style={{ color: "#6b7280" }}>
              Aún no hay subservicios configurados para este servicio.
            </p>
          )}

          {subservicios.length > 0 && (
            <ul className="service-list">
              {subservicios.map((sub) => {
                const idSub = sub.id ?? sub.Id;
                const isSelected = idSub === selectedSubservicioId;
                return (
                  <li
                    key={idSub}
                    className="service-item"
                    style={{
                      cursor: "pointer",
                      borderColor: isSelected ? "#2563eb" : undefined,
                    }}
                    onClick={() => setSelectedSubservicioId(idSub)}
                  >
                    <div className="service-main">
                      <div className="service-title">
                        {sub.nombre ?? sub.Nombre}
                      </div>
                      <div className="service-description">
                        {sub.descripcion ?? sub.Descripcion}
                      </div>
                      <div className="service-meta">
                        <span>
                          <strong>Activo:</strong>{" "}
                          {sub.activo ?? sub.Activo ? "Sí" : "No"}
                        </span>
                      </div>
                    </div>

                    <div className="service-actions">
                      <button
                        type="button"
                        className="service-btn-edit"
                        onClick={(e) => {
                          e.stopPropagation();
                          startEditSubservicio(sub);
                        }}
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        className="service-btn-delete"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEliminarSubservicio(idSub);
                        }}
                      >
                        Desactivar
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          <hr style={{ margin: "1.5rem 0" }} />

          <h3>{editingSubId ? "Editar subservicio" : "Nuevo subservicio"}</h3>

          <form onSubmit={handleSubmitSubservicio} className="admin-form">
            <div className="form-group">
              <label>Nombre del subservicio</label>
              <input
                value={subNombre}
                onChange={(e) => setSubNombre(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Descripción</label>
              <textarea
                rows={2}
                value={subDescripcion}
                onChange={(e) => setSubDescripcion(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Ruta formulario base (PDF) opcional</label>
              <input
                value={subRutaFormularioBase}
                onChange={(e) => setSubRutaFormularioBase(e.target.value)}
                placeholder="/formularios/MI-SERVICIO.pdf"
              />
            </div>

            <div className="form-group form-group-inline">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={subActivo}
                  onChange={(e) => setSubActivo(e.target.checked)}
                />
                <span>Subservicio activo</span>
              </label>
            </div>

            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button type="submit" className="btn-primary" disabled={loading}>
                {editingSubId ? "Guardar cambios" : "Crear subservicio"}
              </button>
              {editingSubId && (
                <button
                  type="button"
                  className="btn-outline"
                  onClick={resetSubForm}
                >
                  Cancelar edición
                </button>
              )}
            </div>
          </form>
        </section>

        {/* Columna derecha: formulario digital */}
        <section className="admin-panel">
          <h2>Formulario digital del subservicio</h2>

          {!selectedSubservicioId && (
            <p style={{ color: "#6b7280" }}>
              Selecciona un subservicio en la lista de la izquierda para
              configurar su formulario digital.
            </p>
          )}

          {selectedSubservicioId && (
            <>
              {errorFormulario && (
                <div
                  className="login-error-banner"
                  style={{ marginBottom: "0.75rem" }}
                >
                  {errorFormulario}
                </div>
              )}

              {loadingFormulario && <p>Cargando formulario...</p>}

              {!loadingFormulario && (
                <form onSubmit={handleGuardarFormulario} className="admin-form">
                  {formCampos.length === 0 && (
                    <p style={{ color: "#6b7280" }}>
                      Aún no hay campos configurados. Agrega los campos que el
                      solicitante deberá completar.
                    </p>
                  )}

                  {formCampos.map((campo, index) => (
                    <div
                      key={index}
                      className="form-group"
                      style={{ borderTop: "1px solid #e5e7eb", paddingTop: 12 }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: 4,
                        }}
                      >
                        <strong>Campo #{index + 1}</strong>
                        <button
                          type="button"
                          className="service-btn-delete"
                          onClick={() => removeCampo(index)}
                        >
                          Eliminar
                        </button>
                      </div>

                      <label>Nombre interno (sin espacios)</label>
                      <input
                        value={campo.nombre}
                        onChange={(e) =>
                          updateCampo(index, "nombre", e.target.value)
                        }
                        placeholder="Ej: cedula, nombreProfesional"
                        required
                      />

                      <label>Etiqueta para mostrar al usuario</label>
                      <input
                        value={campo.etiqueta}
                        onChange={(e) =>
                          updateCampo(index, "etiqueta", e.target.value)
                        }
                        placeholder="Ej: Cédula de identidad"
                      />

                      <label>Tipo de campo</label>
                      <select
                        value={campo.tipo}
                        onChange={(e) =>
                          updateCampo(index, "tipo", e.target.value)
                        }
                      >
                        <option value="texto">Texto</option>
                        <option value="checkbox">Checkbox (Sí/No)</option>
                        <option value="seleccion">Selección (lista)</option>
                      </select>

                      {campo.tipo === "seleccion" && (
                        <>
                          <label>Opciones (una por línea)</label>
                          <textarea
                            rows={3}
                            value={campo.opcionesTexto}
                            onChange={(e) =>
                              updateCampo(
                                index,
                                "opcionesTexto",
                                e.target.value
                              )
                            }
                            placeholder={"Opción 1\nOpción 2\nOpción 3"}
                          />
                        </>
                      )}

                      <div className="form-group form-group-inline">
                        <label className="checkbox-label">
                          <input
                            type="checkbox"
                            checked={campo.requerido}
                            onChange={(e) =>
                              updateCampo(index, "requerido", e.target.checked)
                            }
                          />
                          <span>Campo requerido</span>
                        </label>
                      </div>
                    </div>
                  ))}

                  <button
                    type="button"
                    className="btn-outline"
                    onClick={addCampo}
                    style={{ marginTop: "0.5rem" }}
                  >
                    + Añadir campo
                  </button>

                  <div style={{ marginTop: "1rem", display: "flex", gap: 8 }}>
                    <button
                      type="submit"
                      className="btn-primary"
                      disabled={loadingFormulario}
                    >
                      Guardar formulario
                    </button>

                    {formularioId && (
                      <button
                        type="button"
                        className="btn-danger"
                        disabled={loadingFormulario}
                        onClick={handleEliminarFormulario}
                      >
                        Eliminar formulario
                      </button>
                    )}
                  </div>
                </form>
              )}
            </>
          )}
        </section>
      </div>

      <div style={{ marginTop: "1.5rem" }}>
        <button
          type="button"
          className="btn-outline"
          onClick={() => navigate("/admin/servicios")}
        >
          Volver al catálogo de servicios
        </button>
      </div>
    </div>
  );
}
