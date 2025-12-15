// src/App.jsx
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
// src/router/AppRouter.jsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "../components/ProtectedRoute";

import Login from "../pages/auth/Login.jsx";
import Register from "../pages/auth/Register.jsx";

import AdminDashboard from "../pages/admin/AdminDashboard.jsx";
import AdminServicios from "../pages/admin/AdminServicios.jsx";
import CrearServicio from "../pages/admin/CrearServicio.jsx";
import AdminUsuarios from "../pages/admin/AdminUsuarios.jsx";

import MisSolicitudes from "../pages/solicitante/MisSolicitudes.jsx";
import NuevaSolicitud from "../pages/solicitante/NuevaSolicitud.jsx";
import SolicitudDetalle from "../pages/solicitante/SolicitudDetalle.jsx";
import FormularioDigital from "../pages/solicitante/FormularioDigital.jsx";

import VusDashboard from "../pages/vus/VusDashboard.jsx";
import VusSolicitudes from "../pages/vus/VusSolicitudes.jsx";

import UpcDashboard from "../pages/upc/UpcDashboard.jsx";

export default function App() {
  return (
    <Router>
      <Navbar />

      <Routes>
        {/* Login público */}
        <Route path="/login" element={<Login />} />

        {/* Rutas protegidas */}
        <Route
          path="/admin/servicios"
          element={
            <ProtectedRoute>
              <AdminServicios />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/servicios/crear"
          element={
            <ProtectedRoute>
              <CrearServicio />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/servicios/editar/:id"
          element={
            <ProtectedRoute>
              <CrearServicio />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/mis-solicitudes"
          element={
            <ProtectedRoute roles={["Solicitante"]}>
              <MisSolicitudes />
            </ProtectedRoute>
          }
        />

        <Route
          path="/solicitudes/nueva"
          element={
            <ProtectedRoute roles={["Solicitante"]}>
              <NuevaSolicitud />
            </ProtectedRoute>
          }
        />

        <Route
          path="/solicitudes/:id"
          element={
            <ProtectedRoute>
              <SolicitudDetalle />
            </ProtectedRoute>
          }
        />

        <Route
          path="/formulario-digital/:subservicioId"
          element={
            <ProtectedRoute roles={["Solicitante"]}>
              <FormularioDigital />
            </ProtectedRoute>
          }
        />

        {/* Bandeja VUS */}
        <Route
          path="/vus/solicitudes"
          element={
            <ProtectedRoute roles={["VUS", "Admin"]}>
              <VusDashboard />
            </ProtectedRoute>
          }
        />

        {/* Redirecciones */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}
