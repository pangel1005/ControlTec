// src/pages/vus/VusDashboard.jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/apiClient";

const normalizarEstado = (s = "") =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

const normalizarCedula = (value = "") =>
  value.replace(/[^0-9]/g, "").slice(0, 11);

export default function VusDashboard() {
  const [loadingDepos, setLoadingDepos] = useState(true);
  const [errorDepos, setErrorDepos] = useState("");
  const [solicitudesDepos, setSolicitudesDepos] = useState([]);

  const [cedula, setCedula] = useState("");
  const [buscandoCedula, setBuscandoCedula] = useState(false);
  const [errorCedula, setErrorCedula] = useState("");
  const [solicitudesCedula, setSolicitudesCedula] = useState([]);

  useEffect(() => {
    const cargarSolicitudesVus = async () => {
      setLoadingDepos(true);
      setErrorDepos("");

      try {
        const res = await api.get("/api/Solicitudes");
        const todas = res.data || [];

        const paraRevisionVus = todas.filter((s) => {
          const estado = normalizarEstado(s.estado);
          return (
            estado === "depositada" ||
            estado === "depositadafase1" ||
            estado === "depositadafase2"
          );
        });

        setSolicitudesDepos(paraRevisionVus);
      } catch (err) {
        console.error("Error cargando solicitudes para VUS:", err);
        const status = err.response?.status;

        if (status === 401) {
          setErrorDepos("Tu sesión ha expirado. Vuelve a iniciar sesión.");
        } else {
          setErrorDepos(
            "Ocurrió un error al cargar las solicitudes para revisión."
          );
        }
      } finally {
        setLoadingDepos(false);
      }
    };

    cargarSolicitudesVus();
  }, []);

  const handleBuscarCedula = async (e) => {
    e.preventDefault();
    const ced = normalizarCedula(cedula);

    setErrorCedula("");
    setSolicitudesCedula([]);

    if (!ced) {
      setErrorCedula("Debes escribir una cédula para buscar.");
      return;
    }

    setBuscandoCedula(true);

    try {
      const res = await api.get("/api/Solicitudes");
      const todas = res.data || [];

      const relacionadas = todas.filter((s) => {
        const estado = normalizarEstado(s.estado);
        return (
          estado === "depositada" ||
          estado === "depositadafase1" ||
          estado === "depositadafase2"
        );
      });

      const filtradasPorCedula = relacionadas.filter((s) => {
        return true;
      });

      setSolicitudesCedula(filtradasPorCedula);
    } catch (err) {
      console.error("Error buscando por cédula:", err);
      const status = err.response?.status;

      if (status === 401) {
        setErrorCedula("Tu sesión ha expirado. Vuelve a iniciar sesión.");
      } else if (status === 403) {
        setErrorCedula(
          "No tienes permiso para usar este filtro. Pide que el backend exponga un endpoint para búsqueda por cédula."
        );
      } else {
        setErrorCedula(
          "Ocurrió un error al buscar las solicitudes de ese solicitante."
        );
      }
    } finally {
      setBuscandoCedula(false);
    }
  };

  const getEstadoBadgeClass = (estado) => {
    const estadoNorm = normalizarEstado(estado);
    if (estadoNorm === "depositadafase1") return "badge badge-info";
    if (estadoNorm === "depositadafase2") return "badge badge-primary";
    return "badge badge-warning";
  };

  return (
    <div className="page-container vus-layout">
      <header className="vus-header">
        <h1>Bandeja VUS</h1>
        <p>
          Revisa las solicitudes pendientes de validación por VUS:
          <strong> Depositadas</strong>, <strong>Depositadas Fase 1</strong> y{" "}
          <strong>Depositadas Fase 2</strong>.
        </p>
      </header>

      <section className="vus-card">
        <div className="vus-card-header">
          <h2>Solicitudes para revisión VUS</h2>
          <span className="vus-pill">
            {loadingDepos
              ? "Cargando..."
              : `${solicitudesDepos.length} registro(s)`}
          </span>
        </div>

        {loadingDepos ? (
          <p className="detalle-muted">Cargando solicitudes...</p>
        ) : errorDepos ? (
          <p className="login-error">{errorDepos}</p>
        ) : solicitudesDepos.length === 0 ? (
          <p className="detalle-muted">
            No hay solicitudes pendientes de revisión por VUS.
          </p>
        ) : (
          <div className="tabla-wrapper">
            <table className="tabla-solicitudes tabla-vus">
              <thead>
                <tr>
                  <th style={{ width: "70px" }}>ID</th>
                  <th>Servicio</th>
                  <th style={{ width: "180px" }}>Solicitante</th>
                  <th style={{ width: "130px" }}>Estado</th>
                  <th style={{ width: "190px" }}>Fecha creación</th>
                  <th style={{ width: "80px" }}></th>
                </tr>
              </thead>
              <tbody>
                {solicitudesDepos.map((s) => (
                  <tr key={s.id}>
                    <td>{s.id}</td>
                    <td className="col-servicio">{s.servicio?.nombre}</td>
                    <td>{s.usuario?.nombre ?? "N/D"}</td>
                    <td>
                      <span className={getEstadoBadgeClass(s.estado)}>
                        {s.estado}
                      </span>
                    </td>
                    <td>
                      {new Date(s.fechaCreacion).toLocaleString("es-DO", {
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td>
                      <Link
                        to={`/solicitudes/${s.id}`}
                        className="btn-secondary btn-sm btn-full"
                      >
                        Revisar
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="vus-card">
        <h2 className="vus-card-title">Buscar solicitudes por cédula</h2>

        <form onSubmit={handleBuscarCedula} className="vus-search-form">
          <input
            type="text"
            value={cedula}
            onChange={(e) => setCedula(normalizarCedula(e.target.value))}
            placeholder="Cédula del solicitante (con o sin guiones)"
            className="input-text vus-search-input"
          />
          <button
            type="submit"
            className="btn-primary vus-search-btn"
            disabled={buscandoCedula}
          >
            {buscandoCedula ? "Buscando..." : "Buscar"}
          </button>
        </form>

        {errorCedula && <p className="login-error">{errorCedula}</p>}

        {solicitudesCedula.length > 0 ? (
          <div className="vus-search-results">
            <h3>Resultados de búsqueda</h3>
            <div className="tabla-wrapper">
              <table className="tabla-solicitudes tabla-vus">
                <thead>
                  <tr>
                    <th style={{ width: "70px" }}>ID</th>
                    <th>Servicio</th>
                    <th style={{ width: "180px" }}>Solicitante</th>
                    <th style={{ width: "130px" }}>Estado</th>
                    <th style={{ width: "190px" }}>Fecha creación</th>
                    <th style={{ width: "80px" }}></th>
                  </tr>
                </thead>
                <tbody>
                  {solicitudesCedula.map((s) => (
                    <tr key={s.id}>
                      <td>{s.id}</td>
                      <td className="col-servicio">{s.servicio?.nombre}</td>
                      <td>{s.usuario?.nombre ?? "N/D"}</td>
                      <td>
                        <span className={getEstadoBadgeClass(s.estado)}>
                          {s.estado}
                        </span>
                      </td>
                      <td>
                        {new Date(s.fechaCreacion).toLocaleString("es-DO", {
                          year: "numeric",
                          month: "2-digit",
                          day: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td>
                        <Link
                          to={`/solicitudes/${s.id}`}
                          className="btn-secondary btn-sm btn-full"
                        >
                          Ver
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : cedula && !buscandoCedula ? (
          <p className="detalle-muted" style={{ marginTop: "1rem" }}>
            No se encontraron solicitudes para esta cédula.
          </p>
        ) : null}
      </section>
    </div>
  );
}