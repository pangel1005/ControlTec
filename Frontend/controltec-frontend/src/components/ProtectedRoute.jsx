// src/components/ProtectedRoute.jsx
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children, roles }) {
  const { token, usuario, loading } = useAuth();

  if (loading) return <p>Cargando sesión...</p>;

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Si se pasaron roles, validamos
  if (roles && roles.length > 0) {
    const rolUsuario = usuario?.roll || usuario?.Roll;
    if (!rolUsuario || !roles.includes(rolUsuario)) {
      return <p>No tienes permiso para ver esta página.</p>;
    }
  }

  return children;
}
