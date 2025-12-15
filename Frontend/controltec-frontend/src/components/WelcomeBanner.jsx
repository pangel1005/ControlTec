import { useAuth } from "../context/AuthContext";
import "./WelcomeBanner.css";

export default function WelcomeBanner() {
    const { usuario } = useAuth();

    // Si no hay usuario, no mostramos nada
    if (!usuario) return null;

    return (
        <div className="welcome-banner">
            <div className="welcome-content">
                <span className="welcome-text">
                    ¡Bienvenido, <span className="welcome-name">{usuario.nombre}</span>!
                </span>
            </div>
        </div>
    );
}
