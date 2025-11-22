namespace ControlTec.Models
{
    public class SolicitudCreateDto
    {
        public string Estado { get; set; } = null!;
        public DateTime? FechaCreacion { get; set; }

        public int UsuarioId { get; set; }
        public int ServicioId { get; set; }

        public List<DocumentoCreateDto>? DocumentosCargados { get; set; }
    }

    public class SolicitudUpdateDto
    {
        public string Estado { get; set; } = null!;
        public DateTime? FechaCreacion { get; set; }

        public int UsuarioId { get; set; }
        public int ServicioId { get; set; }

        public List<DocumentoCreateDto>? DocumentosCargados { get; set; }
    }

    public class DocumentoCreateDto
    {
        public string Nombre { get; set; } = null!;
        public string Tipo { get; set; } = null!;
        public string Ruta { get; set; } = null!;
    }
}
