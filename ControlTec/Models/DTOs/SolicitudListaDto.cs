namespace ControlTec.Models.DTOs
{
    public class SolicitudListaDto
    {
        public int Id { get; set; }
        public string Estado { get; set; } = null!;
        public DateTime FechaCreacion { get; set; }
        public UsuarioDto Usuario { get; set; }
        public ServicioDto Servicio { get; set; }
    }
}
