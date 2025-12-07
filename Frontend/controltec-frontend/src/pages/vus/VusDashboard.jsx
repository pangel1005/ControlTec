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

        const depositadas = todas.filter(
          (s) => normalizarEstado(s.estado) === "depositada"
        );

        setSolicitudesDepos(depositadas);
      } catch (err) {
        console.error("Error cargando solicitudes depositadas:", err);
        const status = err.response?.status;

        if (status === 401) {
          setErrorDepos("Tu sesión ha expirado. Vuelve a iniciar sesión.");
        } else {
          setErrorDepos(
            "Ocurrió un error al cargar las solicitudes depositadas."
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
        return estado === "depositada" || estado === "devuelta";
      });

      setSolicitudesCedula(relacionadas);
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

  return (
    <div className="page-container vus-layout">
      <header className="vus-header">
        <h1>Bandeja VUS</h1>
        <p>
          Revisa las solicitudes depositadas y busca por cédula las
          solicitudes devueltas o pendientes de un solicitante.
        </p>
      </header>

      {/* BLOQUE 1: Solicitudes depositadas */}
      <section className="vus-card">
        <div className="vus-card-header">
          <h2>Solicitudes depositadas</h2>
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
            No hay solicitudes en estado <strong>Depositada</strong> para
            revisar.
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
                      <span className="badge badge-warning">{s.estado}</span>
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
        )}
      </section>

      {/* BLOQUE 2: Buscar por cédula */}
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

        {solicitudesCedula.length > 0 && (
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
                        <span
                          className={
                            normalizarEstado(s.estado) === "devuelta"
                              ? "badge badge-danger"
                              : "badge badge-warning"
                          }
                        >
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
        )}
      </section>
    </div>
  );
}
