using ControlTec.Models;
using System.Text.Json.Serialization;

public class Servicio
{
    public int Id { get; set; }
    public string Nombre { get; set; }
    public string Descripcion { get; set; }
    public decimal Costo { get; set; }
    public bool RequierePago { get; set; }
    public bool Activo { get; set; }

    [JsonIgnore]  // Esto evita que la propiedad cause el ciclo
    public ICollection<DocumentoRequerido>? DocumentosRequeridos { get; set; }
}
