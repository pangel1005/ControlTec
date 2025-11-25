using System;
using System.Collections.Generic;

namespace ControlTec.Models.DTOs
{
    /// <summary>
    /// DTO detallado para ver una solicitud con usuario, servicio,
    /// documentos cargados, documentos sugeridos e historial.
    /// </summary>
    public class SolicitudDetalleDto
    {
        public int Id { get; set; }
        public string Estado { get; set; } = null!;
        public DateTime FechaCreacion { get; set; }

        // ----- Datos del usuario -----
        public int UsuarioId { get; set; }
        public string UsuarioNombre { get; set; } = null!;
        public string UsuarioCorreo { get; set; } = null!;
        public string UsuarioRol { get; set; } = null!;

        // ----- Datos del servicio -----
        public int ServicioId { get; set; }
        public string ServicioNombre { get; set; } = null!;
        public string? ServicioDescripcion { get; set; }
        public decimal ServicioCosto { get; set; }
        public bool ServicioRequierePago { get; set; }
        public bool ServicioActivo { get; set; }
        public string? RutaFormularioBase { get; set; }

        // ----- Documentos -----
        public List<DocumentoCargadoDto> DocumentosCargados { get; set; } = new();
        public List<string> DocumentosRequeridos { get; set; } = new();

        // ----- Historial de estados -----
        public List<HistorialMovimientoDto> Historial { get; set; } = new();
    }

    public class DocumentoCargadoDto
    {
        public int Id { get; set; }
        public string Nombre { get; set; } = null!;
        public string Tipo { get; set; } = null!;
        public string Ruta { get; set; } = null!;
    }

    public class HistorialMovimientoDto
    {
        public int Id { get; set; }
        public string? EstadoAnterior { get; set; }
        public string EstadoNuevo { get; set; } = null!;
        public string? Comentario { get; set; }
        public DateTime FechaCambio { get; set; }

        public int? UsuarioId { get; set; }
        public string? UsuarioNombre { get; set; }
    }
}
