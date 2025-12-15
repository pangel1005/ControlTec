// src/pages/admin/AdminUsuarios.jsx
import { useEffect, useState } from "react";
import api from "../../api/apiClient";

const ROLES_POSIBLES = [
  "Solicitante",
  "VUS",
  "TecnicoUPC",
  "EncargadoUPC",
  "Direccion",
  "DNCD",
  "Admin",
];

export default function AdminUsuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // modo edición (null = creando)
  const [editingId, setEditingId] = useState(null);

  // formulario de nuevo / editar usuario
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [cedula, setCedula] = useState("");
  const [rol, setRol] = useState("Solicitante");
  const [activo, setActivo] = useState(true);

  // ✅ nueva contraseña (crear/editar opcional)
  const [password, setPassword] = useState("");

  // búsqueda por cédula
  const [searchCedula, setSearchCedula] = useState("");

  const normalizarCedula = (v = "") => v.replace(/[^0-9]/g, "").slice(0, 11);

  const cargarUsuarios = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await api.get("/api/Usuarios");
      setUsuarios(res.data || []);
    } catch (err) {
      console.error(err);
      const status = err.response?.status;

      if (status && status !== 404) {
        setError("No se pudieron cargar los usuarios.");
      } else {
        setError("");
        setUsuarios([]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarUsuarios();
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setNombre("");
    setCorreo("");
    setCedula("");
    setRol("Solicitante");
    setActivo(true);
    setPassword(""); // ✅ reset
  };

  const handleCrearOEditarUsuario = async (e) => {
    e.preventDefault();
    setError("");

    if (cedula && normalizarCedula(cedula).length !== 11) {
      setError("La cédula debe tener 11 dígitos.");
      return;
    }

    // ✅ Validación: si estás creando, contraseña obligatoria
    if (!editingId && !password.trim()) {
      setError("La contraseña es obligatoria para crear el usuario.");
      return;
    }

    try {
      setLoading(true);

      // ✅ Payload: en crear SIEMPRE va contraseña
      // ✅ En editar, solo se manda si el usuario escribió una nueva
      const payload = {
        nombre,
        correo,
        roll: rol,
        activo,
        esInternoPendiente: rol !== "Solicitante",
        cedula: cedula ? normalizarCedula(cedula) : null,
        ...(editingId
          ? password.trim()
            ? { contraseña: password }
            : {}
          : { contraseña: password }),
      };

      if (editingId) {
        await api.put(`/api/Usuarios/${editingId}`, payload);
      } else {
        await api.post("/api/Usuarios", payload);
      }

      resetForm();
      await cargarUsuarios();
    } catch (err) {
      console.error(err);
      setError("No se pudo guardar el usuario.");
    } finally {
      setLoading(false);
    }
  };

  const handleEliminarUsuario = async (id) => {
    const confirmar = window.confirm(
      "¿Seguro que deseas eliminar este usuario? Esta acción no se puede deshacer."
    );
    if (!confirmar) return;

    try {
      setLoading(true);
      setError("");

      await api.delete(`/api/Usuarios/${id}`);

      if (editingId === id) resetForm();

      await cargarUsuarios();
    } catch (err) {
      console.error(err);
      setError("No se pudo eliminar el usuario.");
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (u) => {
    setEditingId(u.id);
    setNombre(u.nombre || "");
    setCorreo(u.correo || "");
    setCedula(u.cedula || "");
    setRol(u.roll || "Solicitante");
    setActivo(!!u.activo);
    setPassword(""); // ✅ en edición no rellenamos contraseña
  };

  // ====== FILTRADO POR CÉDULA ======
  const cedulaBuscada = normalizarCedula(searchCedula);
  const usuariosFiltrados =
    cedulaBuscada.length > 0
      ? usuarios.filter(
          (u) =>
            u.cedula &&
            normalizarCedula(String(u.cedula)).includes(cedulaBuscada)
        )
      : usuarios;

  return (
    <div className="ct-app">
      <div className="ct-page-container">
        <header className="ct-header">
          <div className="ct-title-group">
            <h1 className="ct-title">Gestión de Usuarios y Perfiles</h1>
            <p className="ct-subtitle">
              Crea usuarios del sistema, define su rol/perfil y controla si están activos.
            </p>
          </div>
        </header>

        {error && <div className="ct-error">{error}</div>}

        <div className="ct-grid-admin-users">
          {/* ==========================
              Columna izquierda: FORM
             ========================== */}
          <section className="ct-card">
            <div className="ct-row-between ct-mb-4">
              <h2 style={{ margin: 0 }}>
                {editingId ? "Editar usuario" : "Crear nuevo usuario"}
              </h2>

              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="ct-btn ct-btn-outline"
                >
                  + Nuevo usuario
                </button>
              )}
            </div>

            <form onSubmit={handleCrearOEditarUsuario} className="ct-col">
              <div className="form-group">
                <label>Nombre completo</label>
                <input
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Correo electrónico</label>
                <input
                  type="email"
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Cédula (opcional / 11 dígitos)</label>
                <input
                  value={cedula}
                  onChange={(e) => setCedula(normalizarCedula(e.target.value))}
                />
              </div>

              <div className="form-group">
                <label>Rol / Perfil</label>
                <select value={rol} onChange={(e) => setRol(e.target.value)}>
                  {ROLES_POSIBLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              {/* ✅ contraseña */}
              <div className="form-group">
                <label>
                  Contraseña{" "}
                  {editingId ? (
                    <span style={{ color: "var(--ct-text-muted)", fontSize: "0.85rem" }}>
                      (opcional: solo si deseas cambiarla)
                    </span>
                  ) : null}
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={editingId ? "Dejar en blanco para mantener" : "Ingrese una contraseña"}
                  required={!editingId}
                />
              </div>

              <div className="form-group">
                <label
                  className="checkbox-label"
                  style={{ display: "flex", gap: "0.5rem" }}
                >
                  <input
                    type="checkbox"
                    checked={activo}
                    onChange={(e) => setActivo(e.target.checked)}
                  />
                  <span>Usuario activo</span>
                </label>
              </div>

              <button type="submit" className="ct-btn ct-btn-primary" disabled={loading}>
                {loading
                  ? "Guardando..."
                  : editingId
                  ? "Guardar cambios"
                  : "Crear usuario"}
              </button>
            </form>
          </section>

          {/* ==========================
              Columna derecha: TABLA
             ========================== */}
          <section className="ct-card">
            <div className="ct-row-between ct-mb-4 ct-wrap">
              <h2 style={{ margin: 0 }}>Usuarios registrados</h2>

              <div className="ct-row ct-gap-2 ct-wrap">
                <input
                  type="text"
                  placeholder="Buscar por cédula"
                  value={searchCedula}
                  onChange={(e) => setSearchCedula(e.target.value)}
                  style={{
                    padding: "0.45rem 0.7rem",
                    borderRadius: "0.5rem",
                    border: "1px solid var(--ct-border)",
                    fontSize: "0.9rem",
                  }}
                />
                {cedulaBuscada.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSearchCedula("")}
                    className="ct-btn ct-btn-outline"
                  >
                    Limpiar
                  </button>
                )}
              </div>
            </div>

            {loading && <div className="ct-loading">Cargando usuarios...</div>}

            {!loading && usuariosFiltrados.length === 0 && (
              <div className="ct-empty">
                {cedulaBuscada.length > 0
                  ? "No se encontraron usuarios con esa cédula."
                  : "No hay usuarios registrados o la API aún no está disponible."}
              </div>
            )}

            {!loading && usuariosFiltrados.length > 0 && (
              <div className="ct-table-wrap">
                <table className="ct-table ct-table--actions">
                  <thead>
                    <tr>
                      <th>Nombre</th>
                      <th>Correo</th>
                      <th>Rol</th>
                      <th>Activo</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>

                  <tbody>
                    {usuariosFiltrados.map((u) => (
                      <tr key={u.id}>
                        <td>{u.nombre}</td>
                        <td>{u.correo}</td>
                        <td>{u.roll}</td>
                        <td>
                          <span
                            className={`ct-badge ${
                              u.activo ? "ct-badge-success" : "ct-badge-neutral"
                            }`}
                          >
                            {u.activo ? "Sí" : "No"}
                          </span>
                        </td>
                        <td>
                          <div className="ct-row ct-wrap ct-gap-2">
                            <button
                              type="button"
                              onClick={() => startEdit(u)}
                              className="ct-btn ct-btn-outline"
                            >
                              Editar
                            </button>

                            <button
                              type="button"
                              onClick={() => handleEliminarUsuario(u.id)}
                              className="ct-btn ct-btn-outline"
                              style={{ borderColor: "#fecaca", color: "#b91c1c" }}
                            >
                              Eliminar
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
