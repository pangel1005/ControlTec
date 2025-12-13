// src/pages/auth/Register.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import logoMp from "../../assets/logo_mp.png"; // Import logo
import "./Register.css"; // Import new styles

export default function Register() {
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [cedula, setCedula] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [tipoUsuario, setTipoUsuario] = useState("Solicitante"); // por defecto
  const [rolInternoDeseado, setRolInternoDeseado] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const { register } = useAuth();
  const navigate = useNavigate();

  const normalizarCedula = (value = "") =>
    value.replace(/[^0-9]/g, "").slice(0, 11); // solo números, máx 11

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    const ced = normalizarCedula(cedula);
    if (ced.length !== 11) {
      setError("La cédula debe tener exactamente 11 dígitos numéricos.");
      return;
    }

    const payload = {
      nombre,
      correo,
      password,
      cedula: ced,
      tipoUsuario, // "Solicitante" o "Interno"
      rolInternoDeseado:
        tipoUsuario === "Interno" && rolInternoDeseado.trim() !== ""
          ? rolInternoDeseado.trim()
          : null,
    };

    try {
      setLoading(true);
      await register(payload);

      setSuccess(
        "Usuario registrado correctamente. En una siguiente versión se agregará la verificación por correo."
      );

      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } catch (err) {
      console.error(err);
      const msg =
        err.response?.data ||
        err.response?.data?.mensaje ||
        "No se pudo completar el registro. Verifica los datos.";
      setError(typeof msg === "string" ? msg : "Error en el servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-container">
      <div className="register-card">
        <img src={logoMp} alt="Ministerio Público" className="logo-mp" />

        <div className="register-header">
          <h1 className="register-title">Crear cuenta</h1>
          <p className="register-subtitle">Registra un nuevo usuario en ControlTec</p>
        </div>

        {error && <div className="register-error-banner">{error}</div>}
        {success && <div className="register-success-banner">{success}</div>}

        <form onSubmit={handleSubmit} className="register-form">
          {/* Nombre */}
          <div className="form-group">
            <label htmlFor="nombre">Nombre completo</label>
            <input
              id="nombre"
              type="text"
              placeholder="Nombre y apellidos"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
            />
          </div>

          {/* Correo */}
          <div className="form-group">
            <label htmlFor="correo">Correo electrónico</label>
            <input
              id="correo"
              type="email"
              placeholder="ejemplo@correo.com"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              required
            />
          </div>

          {/* Cédula */}
          <div className="form-group">
            <label htmlFor="cedula">Cédula (11 dígitos, sin guiones)</label>
            <input
              id="cedula"
              type="text"
              placeholder="Ej: 00112345678"
              value={cedula}
              onChange={(e) => setCedula(normalizarCedula(e.target.value))}
              required
            />
          </div>

          {/* Tipo de usuario */}
          <div className="form-group">
            <label>Tipo de usuario</label>
            <div className="radio-group">
              <label className="radio-label">
                <input
                  type="radio"
                  name="tipoUsuario"
                  value="Solicitante"
                  checked={tipoUsuario === "Solicitante"}
                  onChange={() => setTipoUsuario("Solicitante")}
                />{" "}
                Solicitante externo
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  name="tipoUsuario"
                  value="Interno"
                  checked={tipoUsuario === "Interno"}
                  onChange={() => setTipoUsuario("Interno")}
                />{" "}
                Usuario interno
              </label>
            </div>
          </div>

          {/* Rol interno deseado (solo si es interno) */}
          {tipoUsuario === "Interno" && (
            <div className="form-group">
              <label htmlFor="rolInterno">Rol interno deseado (opcional)</label>
              <input
                id="rolInterno"
                type="text"
                placeholder="Ej: VUS, TecnicoUPC, DNCD..."
                value={rolInternoDeseado}
                onChange={(e) => setRolInternoDeseado(e.target.value)}
              />
            </div>
          )}

          {/* Password */}
          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {/* Confirm password */}
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirmar contraseña</label>
            <input
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="register-submit-btn"
          >
            {loading ? "Registrando..." : "Registrarse"}
          </button>
        </form>

        <div className="login-link-container">
          ¿Ya tienes cuenta?{" "}
          <span
            className="login-link"
            onClick={() => navigate("/login")}
          >
            Inicia sesión
          </span>
        </div>
      </div>
    </div>
  );
}
