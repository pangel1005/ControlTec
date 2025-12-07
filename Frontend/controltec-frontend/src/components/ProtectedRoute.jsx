// src/components/ProtectedRoute.jsx
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children, roles }) {
  const { token, usuario, loading } = useAuth();

  if (loading) return <p>Cargando sesión...</p>;

  // Si no hay token o no hay usuario, mandamos al login
  if (!token || !usuario) {
    return <Navigate to="/login" replace />;
  }

  // Normalizamos el rol del usuario (aceptando varias propiedades)
  const rolUsuario = (
    usuario.roll ??
    usuario.Roll ??
    usuario.rol ??
    usuario.role ??
    ""
  ).trim();

  // Si se pasaron roles, validamos que el usuario esté en la lista
  if (roles && roles.length > 0 && !roles.includes(rolUsuario)) {
    return (
      <div className="page-container">
        <p>No tienes permiso para ver esta página.</p>
      </div>
    );
  }

  return children;
}
