// src/pages/auth/CodigoVerificacion.jsx
import { useState } from "react";
// Importamos el CSS de Login para reutilizar las clases
import "./Login.css";

export default function CodigoVerificacion({ correo, onVerificar, loading }) {
  const [codigo, setCodigo] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    if (!codigo || codigo.length < 4) {
      setError("Ingresa el código de verificación.");
      return;
    }
    onVerificar(codigo);
  };

  return (
    <div className="login-form-container"> {/* Contenedor simple */}
      <div className="login-header">
        <h2 className="login-title">Verificación de código</h2>
        <p className="login-subtitle">
          Hemos enviado un código a <b>{correo}</b>
        </p>
      </div>

      {error && <div className="login-error-banner">{error}</div>}

      <form onSubmit={handleSubmit} className="login-form">
        <div className="form-group">
          <label htmlFor="codigo">Código de Verificación</label>
          <input
            id="codigo"
            type="text"
            placeholder="Ej: 123456"
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
            maxLength={8}
            autoFocus
          />
        </div>

        <button
          type="submit"
          className="login-submit-btn"
          disabled={loading}
        >
          {loading ? "Verificando..." : "Verificar código"}
        </button>
      </form>
    </div>
  );
}
