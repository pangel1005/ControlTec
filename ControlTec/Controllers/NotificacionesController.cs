using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ControlTec.Data;
using ControlTec.Models;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ControlTec.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class NotificacionesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public NotificacionesController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/Notificaciones/usuario/5
        [HttpGet("usuario/{usuarioId}")]
        public async Task<ActionResult<IEnumerable<Notificacion>>> GetNotificaciones(int usuarioId)
        {
            return await _context.Notificaciones
                .Where(n => n.UsuarioId == usuarioId)
                .OrderByDescending(n => n.Fecha)
                .ToListAsync();
        }

        // GET: api/Notificaciones/no-leidas/usuario/5
        [HttpGet("no-leidas/usuario/{usuarioId}")]
        public async Task<ActionResult<int>> GetCantidadNoLeidas(int usuarioId)
        {
            return await _context.Notificaciones
                .Where(n => n.UsuarioId == usuarioId && !n.Leido)
                .CountAsync();
        }

        // PUT: api/Notificaciones/marcar-leida/5
        [HttpPut("marcar-leida/{id}")]
        public async Task<IActionResult> MarcarComoLeida(int id)
        {
            var notificacion = await _context.Notificaciones.FindAsync(id);
            if (notificacion == null)
            {
                return NotFound();
            }

            notificacion.Leido = true;
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // POST: api/Notificaciones (Uso interno)
        [HttpPost]
        public async Task<ActionResult<Notificacion>> CrearNotificacion(Notificacion notificacion)
        {
            _context.Notificaciones.Add(notificacion);
            await _context.SaveChangesAsync();
            return CreatedAtAction("GetNotificaciones", new { usuarioId = notificacion.UsuarioId }, notificacion);
        }
    }
}