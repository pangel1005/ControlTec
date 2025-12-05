// src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from "react";
import api from "../api/apiClient";


const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // 🔹 Recuperar sesión al montar
  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("usuario");

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUsuario(JSON.parse(storedUser));
      api.defaults.headers.common.Authorization = `Bearer ${storedToken}`;
    }

    setLoading(false);
  }, []);

  // 🔹 Login usando la API real
  const login = async (correo, password) => {
    const res = await api.post("/api/Auth/login", {
      correo,
      password,
    });

    const data = res.data; // { token, usuario }

    setToken(data.token);
    setUsuario(data.usuario);

    localStorage.setItem("token", data.token);
    localStorage.setItem("usuario", JSON.stringify(data.usuario));

    api.defaults.headers.common.Authorization = `Bearer ${data.token}`;

    return data.usuario;
  };

  // 🔹 Registro (solo crea el usuario; SIN correo de verificación todavía)
  const register = async (payload) => {
    /*
      payload esperado:
      {
        nombre,
        correo,
        password,
        cedula,
        tipoUsuario,        // "Solicitante" o "Interno"
        rolInternoDeseado,  // opcional
      }
    */

    const res = await api.post("/api/Auth/register", payload);

    // 👉 AQUÍ es donde el otro desarrollador puede enganchar
    // el envío de correo de verificación cuando exista
    // el endpoint correspondiente en el backend
    //
    // Ejemplo futuro:
    // await api.post("/api/Auth/enviar-confirmacion", { correo: payload.correo });

    return res.data; // { mensaje, usuario }
  };

  const logout = () => {
    setToken(null);
    setUsuario(null);

    localStorage.removeItem("token");
    localStorage.removeItem("usuario");

    delete api.defaults.headers.common.Authorization;
  };

  return (
    <AuthContext.Provider
      value={{ usuario, token, loading, login, logout, register }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
}
