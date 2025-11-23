using System.Text.Json.Serialization;

namespace ControlTec.Models
{
    public class Usuario
    {
        public int Id { get; set; }
        public string Nombre { get; set; } = null!;
        public string Correo { get; set; } = null!;

        // 👇 No se enviará en las respuestas JSON ni en Swagger
        [JsonIgnore]
        public string Contraseña { get; set; } = null!;

        public string Roll { get; set; } = null!;  // Ejemplo: admin, usuario
    }
}
