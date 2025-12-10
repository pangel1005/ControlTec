using ControlTec.Data;
using ControlTec.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ControlTec.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class FormulariosDigitalesController : ControllerBase
    {
        private readonly AppDbContext _context;
        public FormulariosDigitalesController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/FormulariosDigitales/subservicio/5
        [HttpGet("subservicio/{subservicioId}")]
        public async Task<ActionResult<FormularioDigital?>> GetFormularioPorSubservicio(int subservicioId)
        {
            var form = await _context.FormulariosDigitales
                .FirstOrDefaultAsync(f => f.SubservicioId == subservicioId);
            if (form == null)
                return NotFound();
            return form;
        }

        // POST: api/FormulariosDigitales
        [HttpPost]
        public async Task<ActionResult<FormularioDigital>> PostFormularioDigital(FormularioDigital formulario)
        {
            _context.FormulariosDigitales.Add(formulario);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetFormularioPorSubservicio), new { subservicioId = formulario.SubservicioId }, formulario);
        }

        // PUT: api/FormulariosDigitales/5
        [HttpPut("{id}")]
        public async Task<IActionResult> PutFormularioDigital(int id, FormularioDigital formulario)
        {
            if (id != formulario.Id)
                return BadRequest();
            _context.Entry(formulario).State = EntityState.Modified;
            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!_context.FormulariosDigitales.Any(f => f.Id == id))
                    return NotFound();
                else
                    throw;
            }
            return NoContent();
        }

        [HttpGet("diagnostico/dbname")]
        public ActionResult<string> GetDatabaseName()
        {
            var dbName = _context.Database.GetDbConnection().Database;
            return Ok($"Base de datos activa: {dbName}");
        }

        // DELETE: api/FormulariosDigitales/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteFormularioDigital(int id)
        {
            var form = await _context.FormulariosDigitales.FindAsync(id);
            if (form == null)
                return NotFound();
            _context.FormulariosDigitales.Remove(form);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}