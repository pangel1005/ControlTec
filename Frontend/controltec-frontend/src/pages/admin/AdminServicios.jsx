// src/pages/admin/AdminServicios.jsx
import { useEffect, useState } from "react";
import api from "../../api/apiClient";

import { useNavigate } from "react-router-dom";

export default function AdminServicios() {
  const navigate = useNavigate();
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
    <div className="page-container admin-servicios-page">
      <h1>Catálogo de Servicios y Requisitos</h1>
      <p className="admin-servicios-desc">
        Configura los servicios y la lista de requisitos (incluyendo formulario PDF e información en PDF) que se usarán en las solicitudes.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
          <button
            className="btn-primary"
            style={{ minWidth: 180 }}
            onClick={() => navigate('/admin/servicios/crear')}
          >
            + Crear nuevo servicio
          </button>
        </div>
        <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px #0001', padding: 24, minWidth: 900 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f3f4f6' }}>
                <th style={{ textAlign: 'left', padding: '8px 12px' }}>Nombre</th>
                <th style={{ textAlign: 'left', padding: '8px 12px' }}>Descripción</th>
                <th style={{ textAlign: 'center', padding: '8px 12px' }}>Costo</th>
                <th style={{ textAlign: 'center', padding: '8px 12px' }}>Pago</th>
                <th style={{ textAlign: 'center', padding: '8px 12px' }}>Activo</th>
                <th style={{ textAlign: 'center', padding: '8px 12px' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {servicios.map((s) => (
                <tr key={s.id ?? s.Id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '8px 12px', fontWeight: 500 }}>{s.nombre ?? s.Nombre}</td>
                  <td style={{ padding: '8px 12px', color: '#374151' }}>{s.descripcion ?? s.Descripcion}</td>
                  <td style={{ padding: '8px 12px', textAlign: 'center' }}>{s.costo ?? s.Costo ?? 0} DOP</td>
                  <td style={{ padding: '8px 12px', textAlign: 'center' }}>{(s.requierePago ?? s.RequierePago) ? 'Sí' : 'No'}</td>
                  <td style={{ padding: '8px 12px', textAlign: 'center' }}>{(s.activo ?? s.Activo) ? 'Sí' : 'No'}</td>
                  <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                    <button
                      style={{
                        marginRight: 8,
                        background: '#16a34a',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 6,
                        padding: '7px 24px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        height: 38,
                        minWidth: 90,
                        fontSize: 15
                      }}
                      onClick={() => navigate(`/admin/servicios/editar/${s.id ?? s.Id}`)}
                    >
                      Editar
                    </button>
                    <button
                      style={{
                        background: '#dc2626',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 6,
                        padding: '7px 24px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        height: 38,
                        minWidth: 90,
                        fontSize: 15
                      }}
                      onClick={() => handleEliminarServicio(s.id ?? s.Id)}
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
