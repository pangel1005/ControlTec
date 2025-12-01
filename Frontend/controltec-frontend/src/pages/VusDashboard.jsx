// src/pages/VusDashboard.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/apiClient";
import { useAuth } from "../context/AuthContext";

export default function VusDashboard() {
  const { usuario } = useAuth();
  const navigate = useNavigate();

  const [depositadas, setDepositadas] = useState([]);
  const [loadingDepositadas, setLoadingDepositadas] = useState(true);
  const [errorDepositadas, setErrorDepositadas] = useState("");

  const [cedula, setCedula] = useState("");
  const [buscandoCedula, setBuscandoCedula] = useState(false);
  const [errorCedula, setErrorCedula] = useState("");
  const [usuarioCedula, setUsuarioCedula] = useState(null);
  const [solicitudesCedula, setSolicitudesCedula] = useState([]);

  const rol = (usuario?.roll || usuario?.Roll || "").trim();

  const normalizarCedula = (value = "") => value.replace(/[^0-9]/g, "");

  // ------- cargar solicitudes en estado Depositada -------
  useEffect(() => {
    const cargarDepositadas = async () => {
      setLoadingDepositadas(true);
      setErrorDepositadas("");

      try {
        // GET /api/Solicitudes/filtro?estado=Depositada
        const res = await api.get("/api/Solicitudes/filtro", {
          params: { estado: "Depositada" },
        });
        setDepositadas(res.data || []);
      } catch (err) {
        console.error("Error cargando solicitudes depositadas:", err);
        setErrorDepositadas(
          err.response?.status === 401 || err.response?.status === 403
            ? "No tienes permiso para ver las solicitudes depositadas. Pide que el backend agregue el rol VUS en este endpoint."
            : "No se pudieron cargar las solicitudes depositadas."
        );
      } finally {
        setLoadingDepositadas(false);
      }
    };

    cargarDepositadas();
  }, []);

  // ------- búsqueda por cédula -------
  const handleBuscarCedula = async (e) => {
    e.preventDefault();

    const ced = normalizarCedula(cedula);

    setErrorCedula("");
    setUsuarioCedula(null);
    setSolicitudesCedula([]);

    if (!ced) {
      setErrorCedula("Debes escribir una cédula para buscar.");
      return;
    }

    setBuscandoCedula(true);

    try {
      // 1) Traer usuarios y buscar por cédula
      const resUsuarios = await api.get("/api/Usuarios");
      const usuarios = resUsuarios.data || [];

      const usuarioMatch = usuarios.find(
        (u) => normalizarCedula(u.cedula || u.Cedula || "") === ced
      );

      if (!usuarioMatch) {
        setErrorCedula("No se encontró un usuario con esa cédula.");
        return;
      }

      setUsuarioCedula(usuarioMatch);

      // 2) Buscar solicitudes de ese usuario
      // GET /api/Solicitudes/filtro?usuarioId={id}
      const resSolicitudes = await api.get("/api/Solicitudes/filtro", {
        params: { usuarioId: usuarioMatch.id ?? usuarioMatch.Id },
      });

      const todas = resSolicitudes.data || [];

      // Nos interesan Depositada + Rechazada/Devuelta
      const relevantes = todas.filter((s) => {
        const e = (s.estado || s.Estado || "").toLowerCase();
        return (
          e.includes("deposit") ||
          e.includes("rechaz") ||
          e.includes("devuelt")
        );
      });

      setSolicitudesCedula(relevantes);
    } catch (err) {
      console.error("Error buscando por cédula:", err);
      setErrorCedula(
        err.response?.status === 401 || err.response?.status === 403
          ? "No tienes permiso para usar el filtro. Pide que el backend agregue el rol VUS en este endpoint."
          : "Ocurrió un error al buscar solicitudes para esta cédula."
      );
    } finally {
      setBuscandoCedula(false);
    }
  };

  const formatFecha = (fechaStr) => {
    if (!fechaStr) return "-";
    const d = new Date(fechaStr);
    if (Number.isNaN(d.getTime())) return "-";
    return d.toLocaleDateString("es-DO", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  const getEstadoClass = (estado = "") => {
    const e = estado.toLowerCase();
    if (e.includes("rechaz") || e.includes("devuelt"))
      return "badge badge-danger";
    if (e.includes("aprob")) return "badge badge-success";
    if (e.includes("deposit")) return "badge badge-info";
    return "badge badge-warning";
  };

  if (rol !== "VUS" && rol !== "Admin") {
    return (
      <div className="page-container">
        <p>No tienes permiso para ver esta pantalla.</p>
      </div>
    );
  }

  return (
    <div className="page-container solicitudes-page">
      <h1 className="solicitudes-title">Bandeja VUS</h1>
      <p className="solicitudes-subtitle">
        Revisa las solicitudes depositadas y busca por cédula las solicitudes
        devueltas o pendientes de un solicitante.
      </p>

      {/* BLOQUE 1: SOLICITUDES DEPOSITADAS */}
      <section className="detalle-section detalle-full-width">
        <h2 className="detalle-section-title">Solicitudes depositadas</h2>

        {loadingDepositadas && <p>Cargando solicitudes depositadas...</p>}
        {errorDepositadas && !loadingDepositadas && (
          <p className="login-error">{errorDepositadas}</p>
        )}

        {!loadingDepositadas &&
          !errorDepositadas &&
          depositadas.length === 0 && (
            <p className="detalle-muted">
              No hay solicitudes en estado <strong>Depositada</strong> en este
              momento.
            </p>
          )}

        {!loadingDepositadas &&
          !errorDepositadas &&
          depositadas.length > 0 && (
            <div className="solicitudes-table-wrapper">
              <table className="solicitudes-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Solicitante</th>
                    <th>Servicio</th>
                    <th>Estado</th>
                    <th>Fecha</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {depositadas.map((s) => (
                    <tr key={s.id}>
                      <td>{s.id}</td>
                      <td>{s.usuario?.nombre}</td>
                      <td>{s.servicio?.nombre}</td>
                      <td>
                        <span className={getEstadoClass(s.estado)}>
                          {s.estado}
                        </span>
                      </td>
                      <td>{formatFecha(s.fechaCreacion)}</td>
                      <td>
                        <button
                          type="button"
                          className="btn-link-table"
                          onClick={() => navigate(`/solicitudes/${s.id}`)}
                        >
                          Ver
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
      </section>

      {/* BLOQUE 2: BÚSQUEDA POR CÉDULA */}
      <section className="detalle-section detalle-full-width">
        <h2 className="detalle-section-title">Buscar solicitudes por cédula</h2>

        <form
          onSubmit={handleBuscarCedula}
          style={{ display: "flex", gap: "0.5rem", marginBottom: "0.75rem" }}
        >
          <input
            type="text"
            placeholder="Cédula del solicitante (con o sin guiones)"
            value={cedula}
            onChange={(e) => setCedula(e.target.value)}
            className="form-control"
            style={{ maxWidth: "260px" }}
          />
          <button
            type="submit"
            className="btn-primary"
            disabled={buscandoCedula}
          >
            {buscandoCedula ? "Buscando..." : "Buscar"}
          </button>
        </form>

        {errorCedula && <p className="login-error">{errorCedula}</p>}

        {usuarioCedula && (
          <p className="detalle-muted">
            Resultados para: <strong>{usuarioCedula.nombre}</strong> (
            {usuarioCedula.correo})
          </p>
        )}

        {solicitudesCedula.length > 0 ? (
          <div className="solicitudes-table-wrapper">
            <table className="solicitudes-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Servicio</th>
                  <th>Estado</th>
                  <th>Fecha</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {solicitudesCedula.map((s) => (
                  <tr key={s.id}>
                    <td>{s.id}</td>
                    <td>{s.servicio?.nombre}</td>
                    <td>
                      <span className={getEstadoClass(s.estado)}>
                        {s.estado}
                      </span>
                    </td>
                    <td>{formatFecha(s.fechaCreacion)}</td>
                    <td>
                      <button
                        type="button"
                        className="btn-link-table"
                        onClick={() => navigate(`/solicitudes/${s.id}`)}
                      >
                        Ver
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          usuarioCedula &&
          !buscandoCedula &&
          !errorCedula && (
            <p className="detalle-muted">
              Ese solicitante no tiene solicitudes Depositadas ni Devueltas /
              Rechazadas.
            </p>
          )
        )}
      </section>
    </div>
  );
}
