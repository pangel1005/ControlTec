namespace ControlTec.Models.DTOs
{
    public class DocumentoDto
    {
        public int Id { get; set; }
        public string Nombre { get; set; } = null!;
        public string Tipo { get; set; } = null!;
        public string Ruta { get; set; } = null!;
    }
}
