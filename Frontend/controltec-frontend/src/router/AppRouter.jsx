// src/router/AppRouter.jsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "../pages/Login.jsx";
import Dashboard from "../pages/Dashboard.jsx";
import MisSolicitudes from "../pages/solicitudes/MisSolicitudes.jsx"; 
import Navbar from "../components/Navbar.jsx";
import ProtectedRoute from "../components/ProtectedRoute.jsx";

export default function AppRouter() {
  return (
    <BrowserRouter>
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
            <ProtectedRoute>
              <MisSolicitudes />
            </ProtectedRoute>
          }
        />

        {/* Redirecciones */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
