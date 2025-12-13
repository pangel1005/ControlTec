namespace ControlTec.Models
{
    public class Solicitud
    {
        public int Id { get; set; }

        public string Estado { get; set; } = null!;

        public DateTime FechaCreacion { get; set; }

        // FK Usuario
        public int UsuarioId { get; set; }
        public Usuario? Usuario { get; set; }        // ← opcional

        // FK Servicio
        public int ServicioId { get; set; }
        public Servicio? Servicio { get; set; }      // ← opcional

        // Documentos relacionados
        public ICollection<Documento>? DocumentosCargados { get; set; } // ← opcional

        public ICollection<HistorialEstado> HistorialEstados { get; set; } = new List<HistorialEstado>();

        public string? RutaCertificado { get; set; }

        public string? RutaComunicacionRechazo { get; set; }


    }
}
