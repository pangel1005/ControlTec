using System.ComponentModel.DataAnnotations.Schema;

namespace ControlTec.Models
{
    [Table("RespuestaFormularioDigital")]
    public class RespuestaFormularioDigital
    {
        public int Id { get; set; }
        public int SolicitudId { get; set; }
        public Solicitud? Solicitud { get; set; }
        public int FormularioDigitalId { get; set; }
        public FormularioDigital? FormularioDigital { get; set; }
        public string RespuestasJson { get; set; } = null!;
        public DateTime FechaEnvio { get; set; } = DateTime.Now;
    }
}  