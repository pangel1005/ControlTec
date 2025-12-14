import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../../api/apiClient";
import "./EmailConfirmation.css";

export default function EmailConfirmation() {
  const [loading, setLoading] = useState(false);
  const [resent, setResent] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  // El correo se pasa por state o query param tras registro
  const correo = location.state?.correo || new URLSearchParams(location.search).get("correo") || "";

  const handleResend = async () => {
    setLoading(true);
    setError("");
    try {
      await api.post("/api/Auth/resend-confirmation", correo, {headers: {"Content-Type": "application/json"}});
      setResent(true);
    } catch (err) {
      setError("No se pudo reenviar el correo. Intenta más tarde.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="email-confirmation-container">
      <div className="email-confirmation-card">
        <h1>Revisa tu correo</h1>
        <p>Hemos enviado un enlace de confirmación a <b>{correo}</b>.</p>
        <p>Por favor, revisa tu bandeja de entrada y sigue el enlace para activar tu cuenta.</p>
        <button onClick={handleResend} disabled={loading || resent} className="resend-btn">
          {resent ? "Correo reenviado" : loading ? "Reenviando..." : "Reenviar correo"}
        </button>
        {error && <div className="error-banner">{error}</div>}
        <p className="info-text">¿Ya confirmaste? <span className="login-link" onClick={() => navigate("/login")}>Inicia sesión</span></p>
      </div>
    </div>
  );
}
