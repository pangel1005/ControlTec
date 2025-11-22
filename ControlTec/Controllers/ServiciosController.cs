using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ControlTec.Data;
using ControlTec.Models;

namespace ControlTec.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ServiciosController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ServiciosController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/Servicios
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Servicio>>> GetServicios()
        {
            return await _context.Servicios.ToListAsync();
        }

        // GET: api/Servicios/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<Servicio>> GetServicio(int id)
        {
            var servicio = await _context.Servicios.FindAsync(id);

            if (servicio == null)
                return NotFound();

            return servicio;
        }

        // 🔥 NUEVO: GET detalle con documentos requeridos
        // GET: api/Servicios/{id}/detalle
        [HttpGet("{id}/detalle")]
        public async Task<ActionResult<object>> GetServicioDetalle(int id)
        {
            var servicio = await _context.Servicios
                .Include(s => s.DocumentosRequeridos)
                .FirstOrDefaultAsync(s => s.Id == id);

            if (servicio == null)
                return NotFound("El servicio no existe.");

            return Ok(new
            {
                servicio.Id,
                servicio.Nombre,
                servicio.Descripcion,
                servicio.Costo,
                servicio.RequierePago,
                servicio.Activo,

                DocumentosRequeridos = servicio.DocumentosRequeridos.Select(dr => new
                {
                    dr.Id,
                    dr.Nombre
                })
            });
        }

        // POST: api/Servicios
        [HttpPost]
        public async Task<ActionResult<Servicio>> PostServicio(Servicio servicio)
        {
            _context.Servicios.Add(servicio);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetServicio), new { id = servicio.Id }, servicio);
        }

        // PUT: api/Servicios/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> PutServicio(int id, Servicio servicio)
        {
            if (id != servicio.Id)
                return BadRequest();

            _context.Entry(servicio).State = EntityState.Modified;

            try { await _context.SaveChangesAsync(); }
            catch (DbUpdateConcurrencyException)
            {
                if (!_context.Servicios.Any(e => e.Id == id))
                    return NotFound();
                else
                    throw;
            }

            return NoContent();
        }

        // DELETE: api/Servicios/{id}
        [HttpDelete("{id}")]
        public async Task<ActionResult<Servicio>> DeleteServicio(int id)
        {
            var servicio = await _context.Servicios.FindAsync(id);
            if (servicio == null)
                return NotFound();

            _context.Servicios.Remove(servicio);
            await _context.SaveChangesAsync();

            return servicio;
        }
    }
}
