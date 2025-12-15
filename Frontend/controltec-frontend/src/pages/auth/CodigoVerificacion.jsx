import { useState } from "react";

export default function CodigoVerificacion({ correo, onVerificar, loading }) {
  const [codigo, setCodigo] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    if (!codigo || codigo.length < 4) {
      setError("Ingresa el código de verificación enviado a tu correo.");
      return;
    }
    onVerificar(codigo);
  };

  return (
    <div className="verificacion-container">
      <h2>Verificación de código</h2>
      <p>
        Ingresa el código que enviamos a <b>{correo}</b>
      </p>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Código de verificación"
          value={codigo}
          onChange={(e) => setCodigo(e.target.value)}
          maxLength={8}
        />
        <button type="submit" disabled={loading}>
          {loading ? "Verificando..." : "Verificar código"}
        </button>
        {error && <div className="error-banner">{error}</div>}
      </form>
    </div>
  );
}
