// src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from "react";
import api from "../api/apiClient";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // 🔹 Al montar la app, recuperamos token/usuario y
  //     dejamos configurado el header Authorization global
  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("usuario");

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUsuario(JSON.parse(storedUser));

      // MUY IMPORTANTE: forzamos el header Authorization en axios
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

    // Guardamos en estado
    setToken(data.token);
    setUsuario(data.usuario);

    // Guardamos en localStorage
    localStorage.setItem("token", data.token);
    localStorage.setItem("usuario", JSON.stringify(data.usuario));

    // MUY IMPORTANTE: forzamos el header Authorization en axios
    api.defaults.headers.common.Authorization = `Bearer ${data.token}`;

    return data.usuario; // por si el login page quiere usarlo
  };

  const logout = () => {
    setToken(null);
    setUsuario(null);

    // Quitamos token guardado
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");

    // Y quitamos el header Authorization global
    delete api.defaults.headers.common.Authorization;
  };

  return (
    <AuthContext.Provider value={{ usuario, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
}
