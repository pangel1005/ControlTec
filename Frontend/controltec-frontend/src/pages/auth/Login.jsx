// src/pages/auth/Login.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

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

      if (!user) {
        throw new Error("No se recibió el usuario desde el backend.");
      }

      const rol = (
        user.roll ??
        user.Roll ??
        user.rol ??
        user.role ??
        ""
      ).trim();

      console.log("Usuario logueado:", user);
      console.log("Rol detectado:", rol);

      switch (rol) {
        case "Solicitante":
          navigate("/mis-solicitudes", { replace: true });
          break;
        case "VUS":
          navigate("/vus/solicitudes", { replace: true });
          break;
        case "TecnicoUPC":
          navigate("/upc/solicitudes", { replace: true });
          break;
        case "EncargadoUPC":
          navigate("/encargado-upc/solicitudes", { replace: true });
          break;
        case "DNCD":
          navigate("/dncd/solicitudes", { replace: true });
          break;  
        case "Admin":
          navigate("/admin", { replace: true });
          break;
        default:
          setError(
            `No se reconoce el rol (${rol || "vacío"}). Verifica la respuesta del backend.`
          );
          break;
      }
    } catch (err) {
      console.error("Error en login:", err);
      setError("Correo o contraseña incorrectos o error en el servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <h1>Bienvenido</h1>
          <p>Inicia sesión en tu cuenta</p>
        </div>

        {error && <div className="login-error-banner">{error}</div>}

        <form onSubmit={handleSubmit} className="login-form">
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
