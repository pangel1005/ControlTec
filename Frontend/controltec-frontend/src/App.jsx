// src/App.jsx
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import MisSolicitudes from "./pages/solicitudes/MisSolicitudes";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import "./styles/layout.css";
import NuevaSolicitud from "./pages/solicitudes/NuevaSolicitud.jsx";
import SolicitudDetalle from "./pages/solicitudes/SolicitudDetalle.jsx";


function AppInner() {
  const location = useLocation();
  const isLoginRoute = location.pathname === "/login";

  return (
    <>
      {/* ✅ No mostrar navbar en /login */}
      {!isLoginRoute && <Navbar />}

      {/* ✅ En /login NO usamos page-container para que el login ocupe toda la pantalla */}
      <div className={isLoginRoute ? "" : "page-container"}>
        <Routes>
          <Route path="/login" element={<Login />} />


          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
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
            path="/mis-solicitudes"
            element={
              <ProtectedRoute>
                <MisSolicitudes />
              </ProtectedRoute>
            }
          />
              <Route
                path="/solicitudes/nueva"
                element={
                  <ProtectedRoute>
                    <NuevaSolicitud />
                  </ProtectedRoute>
            }
          />


          {/* Ajusta esto si tu ruta por defecto es otra */}
          <Route path="*" element={<Navigate to="/login" />} />
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
