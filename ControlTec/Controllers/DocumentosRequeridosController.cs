using ControlTec.Data;
using ControlTec.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ControlTec.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class DocumentosRequeridosController : ControllerBase
    {
        private readonly AppDbContext _context;

        public DocumentosRequeridosController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/DocumentosRequeridos
        [HttpGet]
        public async Task<ActionResult<IEnumerable<DocumentoRequerido>>> GetDocumentosRequeridos()
        {
            return await _context.DocumentosRequeridos
                .AsNoTracking()
                .ToListAsync();
        }

        // GET: api/DocumentosRequeridos/5
        [HttpGet("{id}")]
        public async Task<ActionResult<DocumentoRequerido>> GetDocumentoRequerido(int id)
        {
            var documentoRequerido = await _context.DocumentosRequeridos
                .AsNoTracking()
                .FirstOrDefaultAsync(d => d.Id == id);

            if (documentoRequerido == null)
            {
                return NotFound();
            }

            return documentoRequerido;
        }

        // POST: api/DocumentosRequeridos
        [HttpPost]
        public async Task<ActionResult<DocumentoRequerido>> PostDocumentoRequerido(DocumentoRequerido documentoRequerido)
        {
            // Validar que exista el Servicio
            var servicio = await _context.Servicios
                .AsNoTracking()
                .FirstOrDefaultAsync(s => s.Id == documentoRequerido.ServicioId);

            if (servicio == null)
            {
                return BadRequest("El servicio asociado no existe.");
            }

            _context.DocumentosRequeridos.Add(documentoRequerido);
            await _context.SaveChangesAsync();

            return CreatedAtAction(
                nameof(GetDocumentoRequerido),
                new { id = documentoRequerido.Id },
                documentoRequerido
            );
        }

        // PUT: api/DocumentosRequeridos/5
        [HttpPut("{id}")]
        public async Task<IActionResult> PutDocumentoRequerido(int id, DocumentoRequerido documentoRequerido)
        {
            if (id != documentoRequerido.Id)
            {
                return BadRequest("El id de la URL no coincide con el del cuerpo.");
            }

            // Validar que exista el Servicio
            var servicio = await _context.Servicios
                .AsNoTracking()
                .FirstOrDefaultAsync(s => s.Id == documentoRequerido.ServicioId);

            if (servicio == null)
            {
                return BadRequest("El servicio asociado no existe.");
            }

            _context.Entry(documentoRequerido).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!DocumentoRequeridoExists(id))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }

            return NoContent();
        }

        // DELETE: api/DocumentosRequeridos/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteDocumentoRequerido(int id)
        {
            var documentoRequerido = await _context.DocumentosRequeridos.FindAsync(id);
            if (documentoRequerido == null)
            {
                return NotFound();
            }

            _context.DocumentosRequeridos.Remove(documentoRequerido);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool DocumentoRequeridoExists(int id)
        {
            return _context.DocumentosRequeridos.Any(e => e.Id == id);
        }
    }
}
