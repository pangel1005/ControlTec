using System.ComponentModel.DataAnnotations.Schema;

namespace ControlTec.Models
{
    [Table("FormularioDigital")]
    public class FormularioDigital
    {
        public int Id { get; set; }
        public int SubservicioId { get; set; }
        public Subservicio? Subservicio { get; set; }
        public string EstructuraJson { get; set; } = null!;
        public DateTime FechaCreacion { get; set; } = DateTime.Now;
    }
}