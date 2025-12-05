// src/App.jsx
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";

import Navbar from "./components/Navbar";

import Login from "./pages/Login";
import Register from "./pages/Register"; // 👈 NUEVO
import Dashboard from "./pages/Dashboard";
import MisSolicitudes from "./pages/solicitudes/MisSolicitudes";
import NuevaSolicitud from "./pages/solicitudes/NuevaSolicitud.jsx";
import SolicitudDetalle from "./pages/solicitudes/SolicitudDetalle.jsx";
import VusDashboard from "./pages/VusDashboard.jsx";
import AdminDashboard from "./pages/admin/AdminDashboard.jsx";
import AdminUsuarios from "./pages/admin/AdminUsuarios.jsx";
import AdminServicios from "./pages/admin/AdminServicios.jsx";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

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
      {/* No mostrar navbar en /login ni /registro */}
      {!isAuthRoute && <Navbar />}

      {/* En /login y /registro NO usamos page-container para que ocupen toda la pantalla */}
      <div className={isAuthRoute ? "" : "page-container"}>
        <Routes>
          {/* Login público */}
          <Route path="/login" element={<Login />} />
          {/* ADMIN */}
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


          {/* Registro público */}
          <Route path="/registro" element={<Register />} />

          {/* Dashboard genérico */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
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
