namespace ControlTec.Models.DTOs
{
    // Para crear un servicio
    public class CrearServicioDto
    {
        public string Nombre { get; set; } = null!;
        public string Descripcion { get; set; } = null!;
        public decimal Costo { get; set; }
        public bool RequierePago { get; set; }
        public bool Activo { get; set; } = true;

        // Nombres de documentos requeridos (opcional)
        public List<string>? DocumentosRequeridos { get; set; }
    }

    // Para actualizar un servicio
    public class ActualizarServicioDto
    {
        public string Nombre { get; set; } = null!;
        public string Descripcion { get; set; } = null!;
        public decimal Costo { get; set; }
        public bool RequierePago { get; set; }
        public bool Activo { get; set; }
    }

    // Para crear un documento requerido individual
    public class CrearDocumentoRequeridoDto
    {
        public string Nombre { get; set; } = null!;
    }
}
