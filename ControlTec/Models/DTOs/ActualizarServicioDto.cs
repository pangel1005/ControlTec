namespace ControlTec.Models.DTOs
{
    public class ActualizarServicioDto
    {
        public string Nombre { get; set; } = null!;
        public string Descripcion { get; set; } = null!;
        public decimal Costo { get; set; }
        public bool RequierePago { get; set; }
        public bool Activo { get; set; }

        // 👉 nueva
        public string? RutaFormularioBase { get; set; }
    }
}
