using ControlTec.Data;
using ControlTec.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ControlTec.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class SubserviciosController : ControllerBase
    {
        private readonly AppDbContext _context;
        public SubserviciosController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/Subservicios?servicioId=1
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Subservicio>>> GetSubservicios([FromQuery] int? servicioId)
        {
            var query = _context.Subservicios.AsQueryable();
            if (servicioId.HasValue)
                query = query.Where(s => s.ServicioId == servicioId);
            return await query.ToListAsync();
        }

        // GET: api/Subservicios/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Subservicio>> GetSubservicio(int id)
        {
            var subservicio = await _context.Subservicios.FindAsync(id);
            if (subservicio == null)
                return NotFound();
            return subservicio;
        }

        // POST: api/Subservicios
        [HttpPost]
        public async Task<ActionResult<Subservicio>> PostSubservicio(Subservicio subservicio)
        {
            _context.Subservicios.Add(subservicio);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetSubservicio), new { id = subservicio.Id }, subservicio);
        }

        // PUT: api/Subservicios/5
        [HttpPut("{id}")]
        public async Task<IActionResult> PutSubservicio(int id, Subservicio subservicio)
        {
            if (id != subservicio.Id)
                return BadRequest();
            _context.Entry(subservicio).State = EntityState.Modified;
            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!_context.Subservicios.Any(e => e.Id == id))
                    return NotFound();
                else
                    throw;
            }
            return NoContent();
        }

        // DELETE lógico: api/Subservicios/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteSubservicio(int id)
        {
            var subservicio = await _context.Subservicios.FindAsync(id);
            if (subservicio == null)
                return NotFound();
            subservicio.Activo = false;
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}