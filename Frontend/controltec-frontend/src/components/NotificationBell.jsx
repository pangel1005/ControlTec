import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getNotificaciones, getConteoNoLeidas, marcarComoLeida } from "../api/notificationService";
import "./NotificationBell.css";

export default function NotificationBell() {
    const { usuario } = useAuth();
    const navigate = useNavigate();
    const [notificaciones, setNotificaciones] = useState([]);
    const [conteo, setConteo] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Cerrar dropdown si clic fuera
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Cargar datos iniciales y hacer polling cada 60s
    useEffect(() => {
        if (!usuario?.id) return;

        const fetchData = async () => {
            try {
                const count = await getConteoNoLeidas(usuario.id);
                const list = await getNotificaciones(usuario.id);
                setConteo(count);
                setNotificaciones(list);
            } catch (error) {
                console.error("Error cargando notificaciones:", error);
            }
        };

        fetchData();
        const interval = setInterval(fetchData, 60000); // Polling cada 60 seg
        return () => clearInterval(interval);
    }, [usuario]);

    const handleToggle = () => {
        setIsOpen(!isOpen);
        // Al abrir, podríamos marcar todo como visto (opcional)
        // Pero por diseño mejor marcar al hacer click individualmente
    };

    const handleNotificationClick = async (notif) => {
        try {
            if (!notif.leido) {
                await marcarComoLeida(notif.id);
                // Actualizar estado local para reflejar lectura inmediato
                setNotificaciones((prev) =>
                    prev.map((n) => (n.id === notif.id ? { ...n, leido: true } : n))
                );
                setConteo((prev) => Math.max(0, prev - 1));
            }
            setIsOpen(false);

            // Redirección inteligente
            if (notif.solicitudId) {
                // Asumimos ruta de detalle por ID
                // Esto depende del rol, pero normalmente /solicitudes/:id funciona para ambos si está protegido
                // Si es solicitante:
                if (usuario.roll === "Solicitante") {
                    navigate(`/solicitudes/${notif.solicitudId}`);
                } else {
                    // Para internos
                    // Ojo: Ajustar ruta según tus rutas de VUS/UPC
                    navigate(`/vus/solicitudes`); // Ejemplo genérico, mejor si llevase al detalle
                }
            }
        } catch (error) {
            console.error("Error al procesar notificación", error);
        }
    };

    // Helper para formato de tiempo
    const timeAgo = (dateStr) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);

        if (diffInSeconds < 60) return "Hace un momento";
        const diffInMinutes = Math.floor(diffInSeconds / 60);
        if (diffInMinutes < 60) return `Hace ${diffInMinutes} min`;
        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) return `Hace ${diffInHours} h`;
        return date.toLocaleDateString();
    };

    const getIcon = (tipo) => {
        switch (tipo) {
            case "Exito": return "✅";
            case "Alerta": return "⚠️";
            default: return "ℹ️";
        }
    };

    if (!usuario) return null;

    return (
        <div className="notification-container" ref={dropdownRef}>
            <button
                className={`notification-icon-btn ${conteo > 0 ? "has-new" : ""}`}
                onClick={handleToggle}
                title="Notificaciones"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {conteo > 0 && <span className="notification-badge">{conteo}</span>}
            </button>

            {isOpen && (
                <div className="notification-dropdown">
                    <div className="notification-header">
                        <h3>Notificaciones</h3>
                        {conteo > 0 && <span>{conteo} nuevas</span>}
                    </div>
                    <ul className="notification-list">
                        {notificaciones.length === 0 ? (
                            <li className="notification-empty">No tienes notificaciones recientes.</li>
                        ) : (
                            notificaciones.map((notif) => (
                                <li
                                    key={notif.id}
                                    className={`notification-item ${!notif.leido ? "unread" : ""}`}
                                    onClick={() => handleNotificationClick(notif)}
                                >
                                    <div className={`notif-icon-box notif-type-${notif.tipo}`}>
                                        {getIcon(notif.tipo)}
                                    </div>
                                    <div className="notif-content">
                                        <span className="notif-title">{notif.titulo}</span>
                                        <span className="notif-message">{notif.mensaje}</span>
                                        <span className="notif-time">{timeAgo(notif.fecha)}</span>
                                    </div>
                                </li>
                            ))
                        )}
                    </ul>
                </div>
            )}
        </div>
    );
}
