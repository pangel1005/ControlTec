import api from "./apiClient";

export const getNotificaciones = async (usuarioId) => {
    const res = await api.get(`/api/Notificaciones/usuario/${usuarioId}`);
    return res.data;
};

export const getConteoNoLeidas = async (usuarioId) => {
    const res = await api.get(`/api/Notificaciones/no-leidas/usuario/${usuarioId}`);
    return res.data; // Retorna un int
};

export const marcarComoLeida = async (id) => {
    await api.put(`/api/Notificaciones/marcar-leida/${id}`);
};
