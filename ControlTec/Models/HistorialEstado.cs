namespace ControlTec.Models
{
    public class HistorialEstado
    {
        public int Id { get; set; }

        // FK a Solicitud
        public int SolicitudId { get; set; }
        public Solicitud? Solicitud { get; set; }

        public string? EstadoAnterior { get; set; }   // puede ser null en el primer registro
        public string EstadoNuevo { get; set; } = null!;
        public string? Comentario { get; set; }

        // FK a Usuario (quien hizo el cambio)
        public int UsuarioId { get; set; }
        public Usuario? Usuario { get; set; }

        public DateTime FechaCambio { get; set; } = DateTime.Now;
    }
}
