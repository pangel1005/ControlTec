namespace ControlTec.Models.DTOs
{
    public class HistorialEstadoDto
    {
        public int Id { get; set; }
        public string EstadoAnterior { get; set; }
        public string EstadoNuevo { get; set; }
        public string Comentario { get; set; }
        public DateTime FechaCambio { get; set; }
        public UsuarioDto Usuario { get; set; }
    }
}
