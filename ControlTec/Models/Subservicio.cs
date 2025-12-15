namespace ControlTec.Models
{
    public class Subservicio
    {
        public int Id { get; set; }
        public string Nombre { get; set; } = null!;
        public string? Descripcion { get; set; }
        public int ServicioId { get; set; }
        public Servicio? Servicio { get; set; }
        public string? RutaFormularioBase { get; set; }
        public bool Activo { get; set; } = true;
    }
}