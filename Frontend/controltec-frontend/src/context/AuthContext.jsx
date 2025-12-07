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
    try {
      const storedToken = localStorage.getItem("token");
      const storedUser = localStorage.getItem("usuario");

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUsuario(JSON.parse(storedUser));
        api.defaults.headers.common.Authorization = `Bearer ${storedToken}`;
      }
    } catch (err) {
      console.error("Error restaurando sesión desde localStorage:", err);
      localStorage.removeItem("token");
      localStorage.removeItem("usuario");
    } finally {
      setLoading(false);
    }
  }, []);

  // 🔹 Login usando la API real
  const login = async (correo, password) => {
    // IMPORTANTE: esta es la ruta real de tu backend
    const res = await api.post("/api/Auth/login", {
      correo,
      password,
    });

    const data = res.data || {};

    // Flexibilidad por si el backend cambia nombres de campos
    const jwt = data.token || data.accessToken || data.jwt;
    const user =
      data.usuario ||
      data.user ||
      data.usuarioDTO ||
      null;

    if (!jwt || !user) {
      console.error("Respuesta inesperada de /api/Auth/login:", data);
      throw new Error("Respuesta de login inválida.");
    }

    setToken(jwt);
    setUsuario(user);

    localStorage.setItem("token", jwt);
    localStorage.setItem("usuario", JSON.stringify(user));

    api.defaults.headers.common.Authorization = `Bearer ${jwt}`;

    // 👉 devolvemos SIEMPRE el usuario para que Login.jsx
    // pueda leer el rol y redirigir
    return user;
  };

  // 🔹 Registro (solo crea el usuario)
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
    return res.data; // { mensaje, usuario } (según tu backend)
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
