using System.Text.Json.Serialization;

namespace ControlTec.Models
{
    public class DocumentoRequerido
    {
        public int Id { get; set; }          // PK
        public string Nombre { get; set; } = null!;  // nombre del documento

        public int ServicioId { get; set; }          // FK

        // Relación opcional con el Servicio
        [JsonIgnore]  // Evitar la referencia cíclica
        public Servicio? Servicio { get; set; }      // Relación con Servicio (opcional, ya que es nullable)
    }
}
