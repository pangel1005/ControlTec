namespace ControlTec.Models.DTOs
{
    public class SolicitudDetalleDto
    {
        public int Id { get; set; }
        public string Estado { get; set; } = null!;
        public DateTime FechaCreacion { get; set; }
        public UsuarioDto Usuario { get; set; }
        public ServicioDto Servicio { get; set; }
        public List<DocumentoDto> DocumentosCargados { get; set; }
        public List<HistorialEstadoDto> Historial { get; set; }
    }
}
