using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ControlTec.Data;
using ControlTec.Models;
using ControlTec.Models.DTOs;

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

        // ==============================
        // GET: api/Servicios
        // ?soloActivos=true (opcional)
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
                    DocumentosRequeridos = s.DocumentosRequeridos
                        .Select(dr => new { dr.Id, dr.Nombre })
                        .ToList()
                })
                .ToListAsync();

            return Ok(lista);
        }

        // ==============================
        // GET: api/Servicios/{id}
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
                DocumentosRequeridos = servicio.DocumentosRequeridos
                    .Select(dr => new { dr.Id, dr.Nombre })
                    .ToList()
            };

            return Ok(resultado);
        }

        // ==============================
        // POST: api/Servicios
        // Crear servicio + (opcional) docs requeridos
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
                DocumentosRequeridos = new List<DocumentoRequerido>()
            };

            // Si vienen documentos requeridos, los agregamos
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
                servicio.Activo
            });
        }

        // ==============================
        // PUT: api/Servicios/{id}
        // Actualizar datos básicos (no docs requeridos)
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

            await _context.SaveChangesAsync();
            return NoContent();
        }

        // ==============================
        // DELETE (LÓGICO): api/Servicios/{id}
        // Marca Activo = false
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
        // Re-activar un servicio
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

            var docs = servicio.DocumentosRequeridos
                .Select(dr => new
                {
                    dr.Id,
                    dr.Nombre
                })
                .ToList();

            return Ok(docs);
        }

        // ==============================
        // POST: api/Servicios/{id}/documentos-requeridos
        // Agregar un documento requerido
        // ==============================
        [HttpPost("{id}/documentos-requeridos")]
        public async Task<ActionResult<object>> AgregarDocumentoRequerido(int id, [FromBody] CrearDocumentoRequeridoDto dto)
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
