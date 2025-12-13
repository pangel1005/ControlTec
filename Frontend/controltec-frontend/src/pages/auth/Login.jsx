// src/pages/auth/Login.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import logoMp from "../../assets/logo_mp.png"; // Import logo
import "./Login.css"; // Import new styles

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

      // Normalizamos el rol
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
        case "Direccion":
          // 👉 Ajusta esta ruta al dashboard que vayas a usar para Dirección
          navigate("/direccion/solicitudes", { replace: true });
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
    <div className="login-container">
      <div className="login-card">
        <img src={logoMp} alt="Ministerio Público" className="logo-mp" />

        <div className="login-header">
          <h1 className="login-title">Bienvenido</h1>
          <p className="login-subtitle">Sistema ControlTec</p>
        </div>

        {error && <div className="login-error-banner">{error}</div>}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="email">Correo electrónico</label>
            <input
              id="email"
              type="email"
              placeholder="nombre@ejemplo.com"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <div className="form-label-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <label htmlFor="password" style={{ marginBottom: 0 }}>Contraseña</label>
            </div>

            <div className="password-container">
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

            <button
              type="button"
              className="forgot-password-link"
              onClick={() =>
                alert("Recuperación de contraseña pendiente de implementar")
              }
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="login-submit-btn"
          >
            {loading ? "Iniciando sesión..." : "Iniciar sesión"}
          </button>
        </form>

        <div className="register-text">
          ¿No tienes cuenta?
          <span
            className="register-link"
            onClick={() => navigate("/registro")}
          >
            Regístrate aquí
          </span>
        </div>
      </div>
    </div>
  );
}
