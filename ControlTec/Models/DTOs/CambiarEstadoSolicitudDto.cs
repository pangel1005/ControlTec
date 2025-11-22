namespace ControlTec.Models.DTOs
{
    public class CambiarEstadoSolicitudDto
    {
        public string EstadoNuevo { get; set; } = null!;
        public string? Comentario { get; set; }
        public int UsuarioId { get; set; }
    }
}
