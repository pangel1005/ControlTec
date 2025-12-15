using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using ControlTec.Data;
using ControlTec.Models;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ControlTec.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class DocumentosController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IWebHostEnvironment _env;

        public DocumentosController(AppDbContext context, IWebHostEnvironment env)
        {
            _context = context;
            _env = env;
        }

        // GET: api/Documentos
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Documento>>> GetDocumentos()
        {
            return await _context.Documentos.ToListAsync();
        }

        // GET: api/Documentos/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<Documento>> GetDocumento(int id)
        {
            var documento = await _context.Documentos.FindAsync(id);

            if (documento == null)
                return NotFound();

            return documento;
        }

        // POST: api/Documentos
        // (normalmente usarás SubirDocumento en SolicitudesController,
        // pero dejamos este POST simple por si haces pruebas manuales)
        [HttpPost]
        public async Task<ActionResult<Documento>> PostDocumento(Documento documento)
        {
            _context.Documentos.Add(documento);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetDocumento), new { id = documento.Id }, documento);
        }

        // PUT: api/Documentos/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> PutDocumento(int id, Documento documento)
        {
            if (id != documento.Id)
                return BadRequest();

            _context.Entry(documento).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!DocumentoExists(id))
                    return NotFound();
                else
                    throw;
            }

            return NoContent();
        }

        // DELETE: api/Documentos/{id}
        [HttpDelete("{id}")]
        public async Task<ActionResult<Documento>> DeleteDocumento(int id)
        {
            var documento = await _context.Documentos.FindAsync(id);
            if (documento == null)
                return NotFound();

            // intentar borrar archivo físico
            if (!string.IsNullOrWhiteSpace(documento.Ruta))
            {
                var webRoot = _env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
                var physicalPath = Path.Combine(webRoot, documento.Ruta.TrimStart('/', '\\'));

                if (System.IO.File.Exists(physicalPath))
                {
                    System.IO.File.Delete(physicalPath);
                }
            }

            _context.Documentos.Remove(documento);
            await _context.SaveChangesAsync();

            return documento;
        }

        // GET: api/Documentos/{id}/descargar
        [HttpGet("{id}/descargar")]
        public async Task<IActionResult> DescargarDocumento(int id)
        {
            var documento = await _context.Documentos.FindAsync(id);
            if (documento == null)
                return NotFound("El documento no existe.");

            var webRoot = _env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
            var rutaFisica = Path.Combine(webRoot, documento.Ruta.TrimStart('/', '\\'));

            if (!System.IO.File.Exists(rutaFisica))
                return NotFound("El archivo físico no se encontró en el servidor.");

            var contentType = string.IsNullOrWhiteSpace(documento.Tipo)
                ? "application/octet-stream"
                : documento.Tipo;

            var nombreArchivo = Path.GetFileName(rutaFisica);
            var bytes = await System.IO.File.ReadAllBytesAsync(rutaFisica);

            return File(bytes, contentType, nombreArchivo);
        }

        private bool DocumentoExists(int id)
        {
            return _context.Documentos.Any(e => e.Id == id);
        }
    }
}
