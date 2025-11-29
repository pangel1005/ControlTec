// src/pages/solicitudes/MisSolicitudes.jsx
import Navbar from "../../components/Navbar";

export default function MisSolicitudes() {
  return (
    <div>
      <Navbar />
      <main style={{ padding: "1.5rem" }}>
        <h1>Mis solicitudes</h1>
        <p>
          Aquí luego llamaremos a <code>/api/Solicitudes/usuario/{`{id}`}</code>
          para listar las solicitudes del solicitante.
        </p>
      </main>
    </div>
  );
}
