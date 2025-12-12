// src/App.jsx
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";

import Navbar from "./components/Navbar";

// Auth
import Login from "./pages/auth/Login.jsx";
import Register from "./pages/auth/Register.jsx";

// Solicitante
import MisSolicitudes from "./pages/solicitante/MisSolicitudes.jsx";
import NuevaSolicitud from "./pages/solicitante/NuevaSolicitud.jsx";
import SolicitudDetalle from "./pages/solicitante/SolicitudDetalle.jsx";
import FormularioDigital from "./pages/solicitante/FormularioDigital.jsx";

// Admin
import AdminDashboard from "./pages/admin/AdminDashboard.jsx";
import AdminUsuarios from "./pages/admin/AdminUsuarios.jsx";
import AdminServicios from "./pages/admin/AdminServicios.jsx";
import CrearServicio from "./pages/admin/CrearServicio.jsx";
import EditarServicio from "./pages/admin/EditarServicio.jsx";
import AdminServicioConfig from "./pages/admin/AdminServicioConfig.jsx";

// Técnico UPC
import UpcDashboard from "./pages/upc/UpcDashboard.jsx";

// Encargado UPC
import EncargadoUpcDashboard from "./pages/encargadoUpc/EncargadoUpcDashboard.jsx";

// DNCD
import DncdDashboard from "./pages/dncd/DncdDashboard.jsx";

// VUS
import VusDashboard from "./pages/vus/VusDashboard.jsx";

import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import DireccionDashboard from "./pages/direccion/DireccionDashboard.jsx";

import "./styles/global.css";
import "./styles/layout.css";
import "./styles/auth.css";
import "./styles/solicitudes.css";

function AppInner() {
  const location = useLocation();
  const isAuthRoute =
    location.pathname === "/login" || location.pathname === "/registro";

  return (
    <>
      {!isAuthRoute && <Navbar />}

      <div className={isAuthRoute ? "" : "page-container"}>
        <Routes>
          {/* Públicas */}
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<Register />} />

          {/* Admin */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute roles={["Admin"]}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/usuarios"
            element={
              <ProtectedRoute roles={["Admin"]}>
                <AdminUsuarios />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/servicios"
            element={
              <ProtectedRoute roles={["Admin"]}>
                <AdminServicios />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/servicios/crear"
            element={
              <ProtectedRoute roles={["Admin"]}>
                <CrearServicio />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/servicios/editar/:id"
            element={
              <ProtectedRoute roles={["Admin"]}>
                <EditarServicio />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/servicios/:id/configuracion"
            element={
              <ProtectedRoute roles={["Admin"]}>
                <AdminServicioConfig />
              </ProtectedRoute>
            }
          />

          {/* Solicitante */}
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
            path="/formulario-digital/:subservicioId"
            element={
              <ProtectedRoute roles={["Solicitante"]}>
                <FormularioDigital />
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

          {/* VUS */}
          <Route
            path="/vus/solicitudes"
            element={
              <ProtectedRoute roles={["VUS", "Admin"]}>
                <VusDashboard />
              </ProtectedRoute>
            }
          />

          {/* Técnico UPC */}
          <Route
            path="/upc/solicitudes"
            element={
              <ProtectedRoute roles={["TecnicoUPC", "Admin"]}>
                <UpcDashboard />
              </ProtectedRoute>
            }
          />

          {/* Encargado UPC */}
          <Route
            path="/encargado-upc/solicitudes"
            element={
              <ProtectedRoute roles={["EncargadoUPC", "Admin"]}>
                <EncargadoUpcDashboard />
              </ProtectedRoute>
            }
          />

          {/* DNCD */}
          <Route
            path="/dncd/solicitudes"
            element={
              <ProtectedRoute roles={["DNCD", "Admin"]}>
                <DncdDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/direccion/solicitudes"
            element={
              <ProtectedRoute roles={["Direccion", "Admin"]}>
                <DireccionDashboard />
              </ProtectedRoute>
            }
/>
          {/* Redirecciones */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </div>
    </>
    
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppInner />
      </Router>
    </AuthProvider>
  );
}
