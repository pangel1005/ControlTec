// src/pages/admin/AdminUsuarios.jsx
import { useEffect, useState } from "react";
import api from "../../api/apiClient";

const ROLES_POSIBLES = [
  "Solicitante",
  "VUS",
  "UPC",
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

  // búsqueda por cédula
  const [searchCedula, setSearchCedula] = useState("");

  const normalizarCedula = (v = "") =>
    v.replace(/[^0-9]/g, "").slice(0, 11);

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
  };

  const handleCrearOEditarUsuario = async (e) => {
    e.preventDefault();
    setError("");

    if (cedula && normalizarCedula(cedula).length !== 11) {
      setError("La cédula debe tener 11 dígitos.");
      return;
    }

    try {
      setLoading(true);

      const payload = {
        nombre,
        correo,
        ...(editingId ? {} : { contraseña: "Password123!" }),
        roll: rol,
        activo,
        esInternoPendiente: rol !== "Solicitante",
        cedula: cedula ? normalizarCedula(cedula) : null,
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

      if (editingId === id) {
        resetForm();
      }

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
    <div className="page">
      <h1>Gestión de Usuarios y Perfiles</h1>
      <p>
        Crea usuarios del sistema, define su rol/perfil y controla si están activos.
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
            <h2>{editingId ? "Editar usuario" : "Crear nuevo usuario"}</h2>
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
                + Nuevo usuario
              </button>
            )}
          </div>

          <form onSubmit={handleCrearOEditarUsuario} className="admin-form">
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

            {/* Checkbox estético como en servicios */}
            <div className="form-group form-group-inline">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={activo}
                  onChange={(e) => setActivo(e.target.checked)}
                />
                <span>Usuario activo</span>
              </label>
            </div>

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading
                ? "Guardando..."
                : editingId
                ? "Guardar cambios"
                : "Crear usuario"}
            </button>
          </form>
        </section>

        {/* Columna derecha: tabla de usuarios */}
        <section className="admin-panel">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "1rem",
            }}
          >
            <h2>Usuarios registrados</h2>

            {/* Buscador por cédula */}
            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
              <input
                type="text"
                placeholder="Buscar por cédula"
                value={searchCedula}
                onChange={(e) => setSearchCedula(e.target.value)}
                style={{
                  padding: "0.35rem 0.6rem",
                  borderRadius: "0.5rem",
                  border: "1px solid #e5e7eb",
                  fontSize: "0.85rem",
                }}
              />
              {cedulaBuscada.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSearchCedula("")}
                  style={{
                    fontSize: "0.8rem",
                    borderRadius: "999px",
                    padding: "0.25rem 0.65rem",
                    border: "1px solid #d1d5db",
                    background: "#f9fafb",
                    cursor: "pointer",
                  }}
                >
                  Limpiar
                </button>
              )}
            </div>
          </div>

          {loading && <p>Cargando usuarios...</p>}

          {!loading && usuariosFiltrados.length === 0 && (
            <p style={{ color: "#6b7280", marginTop: "0.75rem" }}>
              {cedulaBuscada.length > 0
                ? "No se encontraron usuarios con esa cédula."
                : "No hay usuarios registrados o la API aún no está disponible."}
            </p>
          )}

          {!loading && usuariosFiltrados.length > 0 && (
            <div className="table-wrapper">
              <table className="table">
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
                      <td>{u.activo ? "Sí" : "No"}</td>
                      <td>
                        <div
                          style={{
                            display: "flex",
                            gap: "0.75rem", // ⬅️ más espacio entre botones
                            flexWrap: "wrap",
                          }}
                        >
                          <button
                            type="button"
                            onClick={() => startEdit(u)}
                            style={{
                              padding: "0.25rem 0.6rem",
                              borderRadius: "0.4rem",
                              border: "1px solid #bbf7d0",
                              background: "#ecfdf5",
                              color: "#166534",
                              cursor: "pointer",
                              fontSize: "0.8rem",
                            }}
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => handleEliminarUsuario(u.id)}
                            style={{
                              padding: "0.25rem 0.6rem",
                              borderRadius: "0.4rem",
                              border: "1px solid #fecaca",
                              background: "#fee2e2",
                              color: "#b91c1c",
                              cursor: "pointer",
                              fontSize: "0.8rem",
                            }}
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
  );
}
