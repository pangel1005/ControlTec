import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./Verify2FA.css";

export default function Verify2FA() {
  console.log("[Verify2FA] Componente montado");
  const [codigo, setCodigo] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { verify2FA } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const sessionToken = localStorage.getItem("sessionToken2FA");
      console.log("[Verify2FA] sessionToken2FA:", sessionToken);
      if (!sessionToken) {
        setError("No se encontró el token de sesión para 2FA.");
        setLoading(false);
        return;
      }
      const user = await verify2FA(codigo, sessionToken);
      localStorage.removeItem("sessionToken2FA");
      // Redirección dinámica según rol
      const rol = (
        user.roll || user.Roll || user.rol || user.role || ""
      ).trim();
      if (rol === "Solicitante") navigate("/mis-solicitudes");
      else if (rol === "VUS") navigate("/vus/solicitudes");
      else if (rol === "TecnicoUPC") navigate("/upc/solicitudes");
      else if (rol === "EncargadoUPC") navigate("/encargado-upc/solicitudes");
      else if (rol === "DNCD") navigate("/dncd/solicitudes");
      else if (rol === "Direccion") navigate("/direccion/solicitudes");
      else if (rol === "Admin") navigate("/admin");
      else navigate("/login");
    } catch (err) {
      console.error("Error al verificar 2FA:", err);
      setError("Código incorrecto o expirado.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="verify2fa-container">
      <form onSubmit={handleSubmit} className="verify2fa-form">
        <h1>Verificación 2FA</h1>
        {error && <div className="error-banner">{error}</div>}
        <input
          type="text"
          placeholder="Ingresa tu código de verificación"
          value={codigo}
          onChange={(e) => setCodigo(e.target.value)}
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? "Verificando..." : "Verificar"}
        </button>
      </form>
    </div>
  );
}
