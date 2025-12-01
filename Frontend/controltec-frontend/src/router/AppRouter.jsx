// src/App.jsx
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Navbar from "./components/Navbar";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import MisSolicitudes from "./pages/solicitudes/MisSolicitudes";
import NuevaSolicitud from "./pages/solicitudes/NuevaSolicitud.jsx";
import SolicitudDetalle from "./pages/solicitudes/SolicitudDetalle.jsx";
import VusDashboard from "./pages/VusDashboard.jsx";
import ProtectedRoute from "./components/ProtectedRoute";

import "./styles/global.css";
import "./styles/layout.css";
import "./styles/auth.css";
import "./styles/solicitudes.css";

export default function App() {
  return (
    <Router>
      <Navbar />

      <Routes>
        {/* Login público */}
        <Route path="/login" element={<Login />} />

        {/* Rutas protegidas */}
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
