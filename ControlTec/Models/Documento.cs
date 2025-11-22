using System.Text.Json.Serialization;

namespace ControlTec.Models
{
    public class Documento
    {
        public int Id { get; set; }

        public string Nombre { get; set; } = null!;
        public string Tipo { get; set; } = null!;   // Ej: PDF, DOCX
        public string Ruta { get; set; } = null!;   // /docs/cedula.pdf

        // Relación con Solicitud
        public int SolicitudId { get; set; }

        [JsonIgnore]              // 👈 para evitar ciclos y que no lo exija en el JSON
        public Solicitud? Solicitud { get; set; }   // 👈 nullable
    }
}
