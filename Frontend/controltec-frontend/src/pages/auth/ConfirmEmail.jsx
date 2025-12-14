import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../../api/apiClient";
import { useAuth } from "../../context/AuthContext";

export default function ConfirmEmail() {
  console.log("[ConfirmEmail] Componente montado");
  const navigate = useNavigate();
  const location = useLocation();
  const correo = new URLSearchParams(location.search).get("correo");
  const token = new URLSearchParams(location.search).get("token");

  const { login } = useAuth();
  const [status, setStatus] = useState("pending");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const confirmar = async () => {
      if (!correo || !token) {
        setStatus("error");
        setErrorMsg("Faltan parámetros de confirmación");
        return;
      }
      try {
        console.log("[ConfirmEmail] POST /api/Auth/confirm-email", { email: correo, token });
        const res = await api.post("/api/Auth/confirm-email", { email: correo, token });
        console.log("[ConfirmEmail] respuesta backend", res.data);
        const { token: jwt, usuario: user } = res.data || {};
        if (jwt && user) {
          localStorage.setItem("token", jwt);
          localStorage.setItem("usuario", JSON.stringify(user));
          api.defaults.headers.common.Authorization = `Bearer ${jwt}`;
          const rol = (user.roll || user.Roll || user.rol || user.role || "").trim();
          setStatus("ok");
          setTimeout(() => {
            if (rol === "Solicitante") navigate("/mis-solicitudes");
            else if (rol === "VUS") navigate("/vus/solicitudes");
            else if (rol === "TecnicoUPC") navigate("/upc/solicitudes");
            else if (rol === "EncargadoUPC") navigate("/encargado-upc/solicitudes");
            else if (rol === "DNCD") navigate("/dncd/solicitudes");
            else if (rol === "Direccion") navigate("/direccion/solicitudes");
            else if (rol === "Admin") navigate("/admin");
            else navigate("/login");
          }, 1500);
        } else {
          setStatus("error");
          setErrorMsg("No se pudo confirmar el correo. Intenta iniciar sesión manualmente.");
        }
      } catch (err) {
        setStatus("error");
        setErrorMsg("Error al confirmar el correo. Intenta más tarde.");
        console.error("[ConfirmEmail] error", err);
      }
    };
    confirmar();
  }, [correo, token, navigate]);

  return (
    <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh'}}>
      <div style={{background: 'white', padding: 32, borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', textAlign: 'center', minWidth: 350}}>
        <h1>Confirmando correo...</h1>
        <p>Por favor espera un momento.</p>
        <p><b>Estado:</b> {status}</p>
        {errorMsg && <div style={{color: 'red', marginTop: 16}}>{errorMsg}</div>}
        <p style={{fontSize: '12px', marginTop: 16, color: '#888'}}>correo: {correo}<br/>token: {token}</p>
      </div>
    </div>
  );
}
