// src/components/BackButtonClean.jsx
import { useNavigate } from "react-router-dom";

export default function BackButton({ fallback = "/" }) {
  const navigate = useNavigate();
  return (
    <button
      type="button"
      className="btn-outline"
      style={{ marginBottom: 16 }}
      onClick={() => navigate(-1)}
      onAuxClick={() => navigate(fallback)}
    >
      ← Volver
    </button>
  );
}
