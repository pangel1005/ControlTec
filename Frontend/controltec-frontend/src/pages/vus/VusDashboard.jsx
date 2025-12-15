// src/pages/vus/VusDashboard.jsx
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/apiClient";

// Normaliza estado (seguro ante null/undefined)
const normalizarEstado = (s = "") =>
  (s ?? "")
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, "");

// Deja solo números, máx 11
const normalizarCedula = (value = "") =>
  (value ?? "").toString().replace(/[^0-9]/g, "").slice(0, 11);

const ESTADOS_VUS = new Set(["depositada", "depositadafase1", "depositadafase2"]);

const formatearFecha = (fechaStr) => {
  if (!fechaStr) return "N/D";
  const d = new Date(fechaStr);
  if (Number.isNaN(d.getTime())) return "N/D";
  return d.toLocaleString("es-DO", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function VusDashboard() {
  const [loadingDepos, setLoadingDepos] = useState(true);
  const [errorDepos, setErrorDepos] = useState("");
  const [solicitudesDepos, setSolicitudesDepos] = useState([]);

  const [cedula, setCedula] = useState("");
  const [buscandoCedula, setBuscandoCedula] = useState(false);
  const [errorCedula, setErrorCedula] = useState("");
  const [solicitudesCedula, setSolicitudesCedula] = useState([]);
  const [yaBuscoCedula, setYaBuscoCedula] = useState(false);

  useEffect(() => {
    const cargarSolicitudesVus = async () => {
      setLoadingDepos(true);
      setErrorDepos("");

      try {
        const res = await api.get("/api/Solicitudes");
        const todas = res.data || [];

        const paraRevisionVus = todas.filter((s) => {
          const estado = normalizarEstado(s?.estado);
          return ESTADOS_VUS.has(estado);
        });

        setSolicitudesDepos(paraRevisionVus);
      } catch (err) {
        console.error("Error cargando solicitudes para VUS:", err);
        const status = err.response?.status;

        if (status === 401) {
          setErrorDepos("Tu sesión ha expirado. Vuelve a iniciar sesión.");
        } else {
          setErrorDepos("Ocurrió un error al cargar las solicitudes para revisión.");
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
    setYaBuscoCedula(true);

    setErrorCedula("");
    setSolicitudesCedula([]);

    if (!ced) {
      setErrorCedula("Debes escribir una cédula para buscar.");
      return;
    }

    if (ced.length !== 11) {
      setErrorCedula("La cédula debe tener exactamente 11 dígitos (sin guiones).");
      return;
    }

    setBuscandoCedula(true);

    try {
      // Si ya tienes solicitudesDepos cargadas, puedes filtrar ahí mismo.
      // Pero mantenemos tu flujo de volver a pedir /api/Solicitudes para NO cambiar comportamiento.
      const res = await api.get("/api/Solicitudes");
      const todas = res.data || [];

      const relacionadas = todas.filter((s) => {
        const estado = normalizarEstado(s?.estado);
        return ESTADOS_VUS.has(estado);
      });

      const filtradasPorCedula = relacionadas.filter((s) => {
        const cedUsuario =
          normalizarCedula(s?.usuario?.cedula) ||
          normalizarCedula(s?.usuario?.Cedula) ||
          normalizarCedula(s?.cedulaSolicitante) ||
          normalizarCedula(s?.CedulaSolicitante);

        return cedUsuario === ced;
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
        setErrorCedula("Ocurrió un error al buscar las solicitudes de ese solicitante.");
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

  const cantidadTabla = useMemo(() => {
    if (loadingDepos) return "Cargando...";
    return `${solicitudesDepos.length} registro(s)`;
  }, [loadingDepos, solicitudesDepos.length]);

  return (
  <div className="ct-app">
    <div className="ct-page-container">
      <header className="ct-header">
        <div className="ct-title-group">
          <h1 className="ct-title">Bandeja VUS</h1>
          <p className="ct-subtitle">
            Revisa las solicitudes pendientes de validación por VUS: <strong>Depositadas</strong>, <strong>Depositadas Fase 1</strong> y <strong>Depositadas Fase 2</strong>.
          </p>
        </div>
      </header>
      <section className="ct-card">
        <div className="ct-card-head ct-row-between">
          <h2 className="ct-card-title">Solicitudes para revisión VUS</h2>
          <span className="ct-badge">{cantidadTabla}</span>
        </div>
        {loadingDepos ? (
          <p className="ct-empty">Cargando solicitudes...</p>
        ) : errorDepos ? (
          <p className="ct-error">{errorDepos}</p>
        ) : solicitudesDepos.length === 0 ? (
          <p className="ct-empty">No hay solicitudes pendientes de revisión por VUS.</p>
        ) : (
          <div className="ct-table-wrap">
            <table className="ct-table">
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
                    <td>{s.servicio?.nombre ?? "N/D"}</td>
                    <td>{s.usuario?.nombre ?? "N/D"}</td>
                    <td>
                      <span className={getEstadoBadgeClass(s.estado)}>{s.estado}</span>
                    </td>
                    <td>{formatearFecha(s.fechaCreacion)}</td>
                    <td>
                      <Link to={`/solicitudes/${s.id}`} className="ct-btn ct-btn-details">
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
    </div>
  </div>
);
}
