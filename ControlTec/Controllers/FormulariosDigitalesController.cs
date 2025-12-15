using ControlTec.Data;
using ControlTec.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;

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
        [Authorize(Roles = "Solicitante,Admin")]
        [HttpGet("subservicio/{subservicioId}")]
        public async Task<ActionResult<FormularioDigital?>> GetFormularioPorSubservicio(int subservicioId)
        {
            var form = await _context.FormulariosDigitales
                .FirstOrDefaultAsync(f => f.SubservicioId == subservicioId);
            if (form == null)
                return NotFound();
            return form;
        }

        // GET: api/FormulariosDigitales/5
        // Usado desde el detalle de solicitud para mostrar los campos del formulario en solo lectura
        // Permite que el solicitante, usuario y todos los roles internos puedan consultarlo
        [Authorize(Roles = "Usuario,Solicitante,VUS,TecnicoUPC,EncargadoUPC,DNCD,Direccion,Admin")]
        [HttpGet("{id}")]
        public async Task<ActionResult<FormularioDigital?>> GetFormulario(int id)
        {
            var form = await _context.FormulariosDigitales.FindAsync(id);
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