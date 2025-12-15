using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ControlTec.Models
{
    public class Notificacion
    {
        [Key]
        public int Id { get; set; }

        public int UsuarioId { get; set; }

        public int? SolicitudId { get; set; }

        public string Titulo { get; set; } = null!;

        public string Mensaje { get; set; } = null!;

        public bool Leido { get; set; } = false;

        public DateTime Fecha { get; set; } = DateTime.Now;

        public string Tipo { get; set; } = "Info"; // Info, Exito, Alerta
    }
}