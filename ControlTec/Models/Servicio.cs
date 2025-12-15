using System.Text.Json.Serialization;

namespace ControlTec.Models
{
    public class Servicio
    {
        public int Id { get; set; }
        public string Nombre { get; set; } = null!;
        public string Descripcion { get; set; } = null!;
        public decimal Costo { get; set; }
        public bool RequierePago { get; set; }
        public bool Activo { get; set; }

        // 👉 Ruta relativa al wwwroot del formulario base en blanco
        //    Ej: "/forms/LI-UPC-01.pdf"
        public string? RutaFormularioBase { get; set; }

        [JsonIgnore]
        public ICollection<DocumentoRequerido>? DocumentosRequeridos { get; set; }
    }
}
