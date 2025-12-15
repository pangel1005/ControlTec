using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using ControlTec.Data;
using ControlTec.Models;
using ControlTec.Models.DTOs;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ControlTec.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ServiciosController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IWebHostEnvironment _env;

        public ServiciosController(AppDbContext context, IWebHostEnvironment env)
        {
            _context = context;
            _env = env;
        }

        // ==============================
        // GET: api/Servicios?soloActivos=true
        // Lista de servicios (catálogo)
        // ==============================
        [HttpGet]
        public async Task<ActionResult<IEnumerable<object>>> GetServicios([FromQuery] bool? soloActivos)
        {
            var query = _context.Servicios
                .Include(s => s.DocumentosRequeridos)
                .AsQueryable();

            if (soloActivos == true)
            {
                query = query.Where(s => s.Activo);
            }

            var lista = await query
                .OrderBy(s => s.Nombre)
                .Select(s => new
                {
                    s.Id,
                    s.Nombre,
                    s.Descripcion,
                    s.Costo,
                    s.RequierePago,
                    s.Activo,
                    s.RutaFormularioBase,
                    DocumentosRequeridos = s.DocumentosRequeridos!
                        .Select(dr => new { dr.Id, dr.Nombre })
                        .ToList()
                })
                .ToListAsync();

            return Ok(lista);
        }

        // ==============================
        // GET: api/Servicios/{id}
        // Detalle de un servicio
        // ==============================
        [HttpGet("{id}")]
        public async Task<ActionResult<object>> GetServicio(int id)
        {
            var servicio = await _context.Servicios
                .Include(s => s.DocumentosRequeridos)
                .FirstOrDefaultAsync(s => s.Id == id);

            if (servicio == null)
                return NotFound("Servicio no encontrado.");

            var resultado = new
            {
                servicio.Id,
                servicio.Nombre,
                servicio.Descripcion,
                servicio.Costo,
                servicio.RequierePago,
                servicio.Activo,
                servicio.RutaFormularioBase,
                DocumentosRequeridos = servicio.DocumentosRequeridos!
                    .Select(dr => new { dr.Id, dr.Nombre })
                    .ToList()
            };

            return Ok(resultado);
        }

        // ==============================
        // GET: api/Servicios/{id}/formulario
        // Devuelve el PDF oficial en blanco del servicio
        // ==============================
        [HttpGet("{id}/formulario")]
        public async Task<IActionResult> DescargarFormularioBase(int id)
        {
            var servicio = await _context.Servicios.FindAsync(id);

            if (servicio == null)
                return NotFound("Servicio no encontrado.");

            if (string.IsNullOrWhiteSpace(servicio.RutaFormularioBase))
                return NotFound("Este servicio no tiene formulario base configurado.");

            var relativePath = servicio.RutaFormularioBase.TrimStart('/', '\\');
            var root = _env.WebRootPath ?? Directory.GetCurrentDirectory();
            var fullPath = Path.Combine(root, relativePath);

            if (!System.IO.File.Exists(fullPath))
                return NotFound("El archivo de formulario no se encuentra en el servidor.");

            var fileName = Path.GetFileName(fullPath);
            return PhysicalFile(fullPath, "application/pdf", fileName);
        }

        // ==============================
        // POST: api/Servicios
        // Crear servicio + docs requeridos
        // ==============================
        [HttpPost]
        public async Task<ActionResult<object>> PostServicio([FromBody] CrearServicioDto dto)
        {
            var servicio = new Servicio
            {
                Nombre = dto.Nombre,
                Descripcion = dto.Descripcion,
                Costo = dto.Costo,
                RequierePago = dto.RequierePago,
                Activo = dto.Activo,
                RutaFormularioBase = dto.RutaFormularioBase,
                DocumentosRequeridos = new List<DocumentoRequerido>()
            };

            if (dto.DocumentosRequeridos != null)
            {
                foreach (var nombreDoc in dto.DocumentosRequeridos)
                {
                    if (!string.IsNullOrWhiteSpace(nombreDoc))
                    {
                        servicio.DocumentosRequeridos.Add(new DocumentoRequerido
                        {
                            Nombre = nombreDoc.Trim()
                        });
                    }
                }
            }

            _context.Servicios.Add(servicio);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetServicio), new { id = servicio.Id }, new
            {
                servicio.Id,
                servicio.Nombre,
                servicio.Descripcion,
                servicio.Costo,
                servicio.RequierePago,
                servicio.Activo,
                servicio.RutaFormularioBase
            });
        }

        // ==============================
        // PUT: api/Servicios/{id}
        // Actualizar datos básicos
        // ==============================
        [HttpPut("{id}")]
        public async Task<IActionResult> PutServicio(int id, [FromBody] ActualizarServicioDto dto)
        {
            var servicio = await _context.Servicios.FindAsync(id);
            if (servicio == null)
                return NotFound("Servicio no encontrado.");

            servicio.Nombre = dto.Nombre;
            servicio.Descripcion = dto.Descripcion;
            servicio.Costo = dto.Costo;
            servicio.RequierePago = dto.RequierePago;
            servicio.Activo = dto.Activo;
            servicio.RutaFormularioBase = dto.RutaFormularioBase;

            await _context.SaveChangesAsync();
            return NoContent();
        }

        // ==============================
        // DELETE lógico: api/Servicios/{id}
        // ==============================
        [HttpDelete("{id}")]
        public async Task<IActionResult> DesactivarServicio(int id)
        {
            var servicio = await _context.Servicios.FindAsync(id);
            if (servicio == null)
                return NotFound("Servicio no encontrado.");

            if (!servicio.Activo)
                return BadRequest("El servicio ya está inactivo.");

            servicio.Activo = false;
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // ==============================
        // POST: api/Servicios/{id}/activar
        // ==============================
        [HttpPost("{id}/activar")]
        public async Task<IActionResult> ActivarServicio(int id)
        {
            var servicio = await _context.Servicios.FindAsync(id);
            if (servicio == null)
                return NotFound("Servicio no encontrado.");

            if (servicio.Activo)
                return BadRequest("El servicio ya está activo.");

            servicio.Activo = true;
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // ==============================
        // GET: api/Servicios/{id}/documentos-requeridos
        // ==============================
        [HttpGet("{id}/documentos-requeridos")]
        public async Task<ActionResult<IEnumerable<object>>> GetDocumentosRequeridos(int id)
        {
            var servicio = await _context.Servicios
                .Include(s => s.DocumentosRequeridos)
                .FirstOrDefaultAsync(s => s.Id == id);

            if (servicio == null)
                return NotFound("Servicio no encontrado.");

            var docs = servicio.DocumentosRequeridos!
                .Select(dr => new { dr.Id, dr.Nombre })
                .ToList();

            return Ok(docs);
        }

        // ==============================
        // POST: api/Servicios/{id}/documentos-requeridos
        // ==============================
        [HttpPost("{id}/documentos-requeridos")]
        public async Task<ActionResult<object>> AgregarDocumentoRequerido(
            int id,
            [FromBody] CrearDocumentoRequeridoDto dto)
        {
            var servicio = await _context.Servicios
                .Include(s => s.DocumentosRequeridos)
                .FirstOrDefaultAsync(s => s.Id == id);

            if (servicio == null)
                return NotFound("Servicio no encontrado.");

            if (string.IsNullOrWhiteSpace(dto.Nombre))
                return BadRequest("El nombre del documento es obligatorio.");

            var doc = new DocumentoRequerido
            {
                Nombre = dto.Nombre.Trim(),
                ServicioId = servicio.Id
            };

            _context.DocumentosRequeridos.Add(doc);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                doc.Id,
                doc.Nombre,
                doc.ServicioId
            });
        }

        // ==============================
        // DELETE: api/Servicios/{id}/documentos-requeridos/{docId}
        // ==============================
        [HttpDelete("{id}/documentos-requeridos/{docId}")]
        public async Task<IActionResult> EliminarDocumentoRequerido(int id, int docId)
        {
            var doc = await _context.DocumentosRequeridos
                .FirstOrDefaultAsync(d => d.Id == docId && d.ServicioId == id);

            if (doc == null)
                return NotFound("Documento requerido no encontrado para este servicio.");

            _context.DocumentosRequeridos.Remove(doc);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}
