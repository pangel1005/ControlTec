// src/pages/Login.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const user = await login(correo, password);

      const rol = user?.roll ?? user?.Roll ?? user?.rol;

      if (rol === "Solicitante") {
        navigate("/mis-solicitudes");
      } else if (rol === "VUS") {
        navigate("/vus/solicitudes");
      } else if (rol === "Admin") {
        navigate("/admin");
      } else {
        navigate("/dashboard");
      }
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
          <p>Inicia sesión en tu cuenta</p>
        </div>

        {/* Mensaje de error */}
        {error && <div className="login-error-banner">{error}</div>}

        {/* Formulario */}
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

            <div className="password-input-wrapper">
              <input
                id="password"
                type={mostrarPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setMostrarPassword((v) => !v)}
              >
                {mostrarPassword ? "Ocultar" : "Ver"}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary login-submit"
          >
            {loading ? "Iniciando sesión..." : "Iniciar sesión"}
          </button>
        </form>

        {/* Enlace a registro */}
        <p className="login-register-text">
          ¿No tienes cuenta?{" "}
          <span
            className="link-button"
            style={{ cursor: "pointer" }}
            onClick={() => navigate("/registro")}
          >
            Regístrate aquí
          </span>
        </p>
      </div>
    </div>
  );
}
