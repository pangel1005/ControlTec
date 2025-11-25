using System;

namespace ControlTec.Models.DTOs
{
    /// <summary>
    /// DTO resumido para listar solicitudes (por usuario o para el admin).
    /// </summary>
    public class SolicitudListaDto
    {
        public int Id { get; set; }
        public string Estado { get; set; } = null!;
        public DateTime FechaCreacion { get; set; }

        // Info básica del servicio asociado
        public int ServicioId { get; set; }
        public string ServicioNombre { get; set; } = null!;
        public decimal ServicioCosto { get; set; }
    }
}
