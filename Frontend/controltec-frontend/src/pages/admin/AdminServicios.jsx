// src/pages/admin/AdminServicios.jsx
import { useEffect, useState } from "react";
import api from "../../api/apiClient";
import { useNavigate } from "react-router-dom";

export default function AdminServicios() {
  const navigate = useNavigate();
  const [servicios, setServicios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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

  const handleEliminarServicio = async (id) => {
    const confirmar = window.confirm(
      "¿Seguro que deseas eliminar este servicio? Esta acción no se puede deshacer."
    );
    if (!confirmar) return;

    try {
      setLoading(true);
      setError("");

      await api.delete(`/api/Servicios/${id}`);
      await cargarServicios();
    } catch (err) {
      console.error(err);
      setError("No se pudo eliminar el servicio.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ct-app">
      <div className="ct-page-container">
        <header className="ct-header">
          <div className="ct-title-group">
            <h1 className="ct-title">Catálogo de Servicios y Requisitos</h1>
            <p className="ct-subtitle">
              Configura los servicios y la lista de requisitos (incluyendo formulario PDF e información en PDF)
              que se usarán en las solicitudes.
            </p>
          </div>

          <div className="ct-header-actions">
            <button
              type="button"
              className="ct-btn ct-btn-primary"
              onClick={() => navigate("/admin/servicios/crear")}
            >
              + Crear nuevo servicio
            </button>
          </div>
        </header>

        {error && <div className="ct-error">{error}</div>}
        {loading && <div className="ct-loading">Cargando servicios...</div>}

        {!loading && servicios.length === 0 && (
          <div className="ct-empty">No hay servicios registrados.</div>
        )}

        {!loading && servicios.length > 0 && (
          <section className="ct-card">
            <div className="ct-table-wrap">
              {/* ✅ Variante de columnas para 6 columnas */}
              <table className="ct-table ct-table--services">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Descripción</th>
                    <th style={{ textAlign: "center" }}>Costo</th>
                    <th style={{ textAlign: "center" }}>Pago</th>
                    <th style={{ textAlign: "center" }}>Activo</th>
                    <th style={{ textAlign: "center" }}>Acciones</th>
                  </tr>
                </thead>

                <tbody>
                  {servicios.map((s) => {
                    const id = s.id ?? s.Id;
                    const nombre = s.nombre ?? s.Nombre ?? "";
                    const descripcion = s.descripcion ?? s.Descripcion ?? "";
                    const costo = s.costo ?? s.Costo ?? 0;
                    const requierePago = s.requierePago ?? s.RequierePago;
                    const activo = s.activo ?? s.Activo;

                    return (
                      <tr key={id}>
                        <td style={{ fontWeight: 600 }}>{nombre}</td>
                        <td style={{ color: "var(--ct-text-muted)" }}>{descripcion}</td>
                        <td style={{ textAlign: "center" }}>{costo} DOP</td>
                        <td style={{ textAlign: "center" }}>{requierePago ? "Sí" : "No"}</td>
                        <td style={{ textAlign: "center" }}>
                          <span
                            className={`ct-badge ${
                              activo ? "ct-badge-success" : "ct-badge-neutral"
                            }`}
                          >
                            {activo ? "Sí" : "No"}
                          </span>
                        </td>
                        <td style={{ textAlign: "center" }}>
                          <div className="ct-row ct-gap-2 ct-wrap" style={{ justifyContent: "center" }}>
                            <button
                              type="button"
                              className="ct-btn ct-btn-outline"
                              onClick={() => navigate(`/admin/servicios/editar/${id}`)}
                            >
                              Editar
                            </button>

                            {/* Si quieres 100% sin inline, te hago ct-btn-danger */}
                            <button
                              type="button"
                              className="ct-btn ct-btn-outline"
                              style={{ borderColor: "#fecaca", color: "#b91c1c" }}
                              onClick={() => handleEliminarServicio(id)}
                            >
                              Eliminar
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
