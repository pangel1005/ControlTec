// src/pages/Login.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(correo, password); // 👉 aquí sigue usando tu API/AuthContext
      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      setError("Correo o contraseña incorrectos o error en el servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        {/* Header */}
        <div className="login-header">
          <h1>Bienvenido</h1>
          <p>Inicia sesión en tu cuenta de ControlTec.</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="login-form">
          {/* Correo */}
          <div className="form-group">
            <label htmlFor="email">Correo electrónico</label>
            <input
              id="email"
              type="email"
              placeholder="ejemplo@correo.com"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              required
            />
          </div>

          {/* Contraseña */}
          <div className="form-group">
            <div className="form-label-row">
              <label htmlFor="password">Contraseña</label>
              {/* Esto es solo visual por ahora */}
              <button
                type="button"
                className="link-button"
                onClick={() =>
                  alert("Recuperación de contraseña pendiente de implementar")
                }
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {/* Error */}
          {error && <p className="login-error">{error}</p>}

          {/* Botón */}
          <button
            type="submit"
            disabled={loading}
            className="btn-primary login-submit"
          >
            {loading ? "Iniciando sesión..." : "Iniciar sesión"}
          </button>
        </form>
      </div>
    </div>
  );
}
