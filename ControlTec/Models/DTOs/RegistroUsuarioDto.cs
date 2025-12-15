namespace ControlTec.Models.DTOs
{
    public class RegistroUsuarioDto
    {
        public string Nombre { get; set; } = null!;
        public string Correo { get; set; } = null!;
        public string Password { get; set; } = null!;

        // Cédula dominicana obligatoria (11 dígitos, sin guiones)
        public string Cedula { get; set; } = null!;

        /// <summary>
        /// "Solicitante" o "Interno"
        /// </summary>
        public string TipoUsuario { get; set; } = "Solicitante";

        /// <summary>
        /// Opcional: qué rol interno quiere (VUS, DNCD, etc.).
        /// Solo se usa si TipoUsuario = "Interno".
        /// Esto NO se asigna de una vez, solo queda como referencia a nivel de front / formulario.
        /// </summary>
        public string? RolInternoDeseado { get; set; }
    }

    public class AprobarInternoDto
    {
        /// <summary>
        /// Rol final que el Admin le va a dar al usuario interno.
        /// Ej: "VUS", "DNCD", "EncargadoUPC", "TecnicoUPC", "Analista", "Direccion", "Admin"
        /// </summary>
        public string NuevoRol { get; set; } = null!;
    }
}
