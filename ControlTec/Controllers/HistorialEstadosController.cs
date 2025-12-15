using ControlTec.Data;
using ControlTec.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ControlTec.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class HistorialEstadosController : ControllerBase
    {
        private readonly AppDbContext _context;

        public HistorialEstadosController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/HistorialEstados/solicitud/5
        [HttpGet("solicitud/{solicitudId}")]
        public async Task<ActionResult<IEnumerable<HistorialEstado>>> GetPorSolicitud(int solicitudId)
        {
            var existeSolicitud = await _context.Solicitudes
                .AnyAsync(s => s.Id == solicitudId);

            if (!existeSolicitud)
                return NotFound($"La solicitud {solicitudId} no existe.");

            var historial = await _context.HistorialEstados
                .Where(h => h.SolicitudId == solicitudId)
                .OrderBy(h => h.FechaCambio)
                .ToListAsync();

            return historial;
        }

        // POST: api/HistorialEstados
        [HttpPost]
        public async Task<ActionResult<HistorialEstado>> PostHistorial(HistorialEstado entrada)
        {
            // Validar Solicitud
            var solicitud = await _context.Solicitudes
                .FirstOrDefaultAsync(s => s.Id == entrada.SolicitudId);

            if (solicitud == null)
                return BadRequest("La solicitud indicada no existe.");

            // Validar Usuario
            var usuario = await _context.Usuarios
                .FirstOrDefaultAsync(u => u.Id == entrada.UsuarioId);

            if (usuario == null)
                return BadRequest("El usuario indicado no existe.");

            // Si no envían EstadoAnterior, lo puedes rellenar con el estado actual de la solicitud
            if (string.IsNullOrEmpty(entrada.EstadoAnterior))
                entrada.EstadoAnterior = solicitud.Estado;

            entrada.FechaCambio = DateTime.Now;

            // Guardar en Historial
            _context.HistorialEstados.Add(entrada);

            // Opcional: actualizar el estado actual de la solicitud
            solicitud.Estado = entrada.EstadoNuevo;
            _context.Solicitudes.Update(solicitud);

            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetPorSolicitud),
                new { solicitudId = entrada.SolicitudId },
                entrada);
        }
    }
}
