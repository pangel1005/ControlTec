using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using ControlTec.Data;
using ControlTec.Models;
using ControlTec.Models.DTOs;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ControlTec.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class SolicitudesController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IWebHostEnvironment _env;

        public SolicitudesController(AppDbContext context, IWebHostEnvironment env)
        {
            _context = context;
            _env = env;
        }

        // ======================================
        // 1. GET: TODAS LAS SOLICITUDES
        // ======================================
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Solicitud>>> GetSolicitudes()
        {
            return await _context.Solicitudes
                .Include(s => s.Servicio)
                .Include(s => s.Usuario)
                .ToListAsync();
        }

        // ======================================
        // 1.b) GET: SOLICITUDES POR USUARIO
        //      api/Solicitudes/usuario/1
        // ======================================
        [HttpGet("usuario/{usuarioId}")]
        public async Task<ActionResult<IEnumerable<object>>> GetSolicitudesPorUsuario(int usuarioId)
        {
            var solicitudes = await _context.Solicitudes
                .Include(s => s.Servicio)
                .Where(s => s.UsuarioId == usuarioId)
                .ToListAsync();

            var resultado = solicitudes.Select(s => new
            {
                s.Id,
                s.Estado,
                s.FechaCreacion,
                Servicio = new
                {
                    s.Servicio.Id,
                    s.Servicio.Nombre,
                    s.Servicio.Costo
                }
            });

            return Ok(resultado);
        }

        // ======================================
        // 2. POST: CREAR SOLICITUD
        // ======================================
        [HttpPost]
        public async Task<ActionResult<Solicitud>> PostSolicitud(Solicitud solicitud)
        {
            // Validar usuario
            var usuario = await _context.Usuarios.FindAsync(solicitud.UsuarioId);
            if (usuario == null)
                return BadRequest("El usuario no existe.");

            // Validar servicio
            var servicio = await _context.Servicios.FindAsync(solicitud.ServicioId);
            if (servicio == null)
                return BadRequest("El servicio no existe.");

            // Estado y fecha por defecto
            if (string.IsNullOrWhiteSpace(solicitud.Estado))
                solicitud.Estado = "Pendiente";

            if (solicitud.FechaCreacion == default)
                solicitud.FechaCreacion = DateTime.Now;

            _context.Solicitudes.Add(solicitud);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetSolicitudes), new { id = solicitud.Id }, solicitud);
        }

        // ======================================
        // 3. PUT: ACTUALIZAR SOLICITUD
        // ======================================
        [HttpPut("{id}")]
        public async Task<IActionResult> PutSolicitud(int id, Solicitud solicitud)
        {
            if (id != solicitud.Id)
                return BadRequest("El id de la ruta no coincide con el del cuerpo.");

            // Validar usuario
            var usuario = await _context.Usuarios.FindAsync(solicitud.UsuarioId);
            if (usuario == null)
                return BadRequest("El usuario no existe.");

            // Validar servicio
            var servicio = await _context.Servicios.FindAsync(solicitud.ServicioId);
            if (servicio == null)
                return BadRequest("El servicio no existe.");

            _context.Entry(solicitud).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!SolicitudExists(id))
                    return NotFound();
                else
                    throw;
            }

            return NoContent();
        }

        // ======================================
        // 4. DELETE: ELIMINAR SOLICITUD
        // ======================================
        [HttpDelete("{id}")]
        public async Task<ActionResult<Solicitud>> DeleteSolicitud(int id)
        {
            var solicitud = await _context.Solicitudes.FindAsync(id);
            if (solicitud == null)
                return NotFound();

            _context.Solicitudes.Remove(solicitud);
            await _context.SaveChangesAsync();

            return solicitud;
        }

        private bool SolicitudExists(int id)
        {
            return _context.Solicitudes.Any(e => e.Id == id);
        }

        // ======================================
        // 5. GET: DETALLE COMPLETO DE UNA SOLICITUD
        //      api/Solicitudes/{id}/detalle
        // ======================================
        [HttpGet("{id}/detalle")]
        public async Task<ActionResult<object>> GetDetalle(int id)
        {
            var solicitud = await _context.Solicitudes
                .Include(s => s.Usuario)
                .Include(s => s.Servicio)
                    .ThenInclude(s => s.DocumentosRequeridos)
                .Include(s => s.DocumentosCargados)
                .Include(s => s.HistorialEstados)
                    .ThenInclude(h => h.Usuario)
                .FirstOrDefaultAsync(s => s.Id == id);

            if (solicitud == null)
                return NotFound("Solicitud no encontrada.");

            // Aquí está la corrección importante:
            // primero garantizamos una lista de Documento, luego proyectamos.
            var documentos = (solicitud.DocumentosCargados ?? new List<Documento>())
                .Select(d => new
                {
                    d.Id,
                    d.Nombre,
                    d.Tipo,
                    d.Ruta,
                    d.SolicitudId
                })
                .ToList();

            var resultado = new
            {
                solicitud.Id,
                solicitud.Estado,
                solicitud.FechaCreacion,

                Usuario = solicitud.Usuario == null ? null : new
                {
                    solicitud.Usuario.Id,
                    solicitud.Usuario.Nombre,
                    solicitud.Usuario.Correo,
                    solicitud.Usuario.Roll
                },

                Servicio = solicitud.Servicio == null ? null : new
                {
                    solicitud.Servicio.Id,
                    solicitud.Servicio.Nombre,
                    solicitud.Servicio.Descripcion,
                    solicitud.Servicio.Costo,
                    solicitud.Servicio.RequierePago,
                    solicitud.Servicio.Activo
                },

                DocumentosCargados = documentos,

                DocumentosRequeridos = solicitud.Servicio?.DocumentosRequeridos?
                    .Select(dr => new
                    {
                        dr.Id,
                        dr.Nombre
                    })
                    .ToList(),

                Historial = solicitud.HistorialEstados
                    .OrderBy(h => h.FechaCambio)
                    .Select(h => new
                    {
                        h.Id,
                        h.EstadoAnterior,
                        h.EstadoNuevo,
                        h.Comentario,
                        h.FechaCambio,
                        Usuario = h.Usuario == null ? null : new
                        {
                            h.Usuario.Id,
                            h.Usuario.Nombre,
                            h.Usuario.Correo,
                            h.Usuario.Roll
                        }
                    })
                    .ToList()
            };

            return Ok(resultado);
        }

        // ======================================
        // 6. POST: CAMBIAR ESTADO (opcional, si lo usas)
        //      api/Solicitudes/{id}/cambiar-estado
        // ======================================
        [HttpPost("{id}/cambiar-estado")]
        public async Task<ActionResult<object>> CambiarEstado(int id, CambiarEstadoSolicitudDto dto)
        {
            var solicitud = await _context.Solicitudes
                .Include(s => s.HistorialEstados)
                .FirstOrDefaultAsync(s => s.Id == id);

            if (solicitud == null)
                return NotFound("La solicitud no existe.");

            var usuario = await _context.Usuarios.FindAsync(dto.UsuarioId);
            if (usuario == null)
                return BadRequest("El usuario que realiza el cambio no existe.");

            var estadoAnterior = solicitud.Estado;
            var estadoNuevo = dto.EstadoNuevo;

            var transicionesValidas = new List<(string? Desde, string Hacia)>
            {
                (null,           "Depositada"),
                ("Pendiente",    "Depositada"),
                ("Depositada",   "Revisión VUS"),
                ("Revisión VUS", "Aprobada"),
                ("Revisión VUS", "Rechazada")
            };

            var esValida = transicionesValidas.Any(t =>
                string.Equals(t.Desde ?? string.Empty, estadoAnterior ?? string.Empty, StringComparison.OrdinalIgnoreCase) &&
                string.Equals(t.Hacia, estadoNuevo, StringComparison.OrdinalIgnoreCase));

            if (!esValida)
                return BadRequest($"Transición de estado no permitida: '{estadoAnterior}' → '{estadoNuevo}'.");

            solicitud.Estado = estadoNuevo;

            var nuevoHistorial = new HistorialEstado
            {
                SolicitudId = solicitud.Id,
                EstadoAnterior = estadoAnterior,
                EstadoNuevo = estadoNuevo,
                Comentario = dto.Comentario,
                UsuarioId = dto.UsuarioId,
                FechaCambio = DateTime.Now
            };

            _context.HistorialEstados.Add(nuevoHistorial);
            await _context.SaveChangesAsync();

            var resultado = new
            {
                solicitud.Id,
                EstadoAnterior = estadoAnterior,
                EstadoNuevo = estadoNuevo,
                Historial = new
                {
                    nuevoHistorial.Id,
                    nuevoHistorial.Comentario,
                    nuevoHistorial.FechaCambio,
                    Usuario = new
                    {
                        usuario.Id,
                        usuario.Nombre,
                        usuario.Correo,
                        usuario.Roll
                    }
                }
            };

            return Ok(resultado);
        }

        // ============================
        // 6. SUBIR DOCUMENTO A SOLICITUD
        // ============================
        [HttpPost("{id}/documentos")]
        [Consumes("multipart/form-data")]      // 👈 importante para Swagger
        public async Task<ActionResult<Documento>> SubirDocumento(int id, IFormFile archivo)
        {
            if (archivo == null || archivo.Length == 0)
                return BadRequest("Debe seleccionar un archivo.");

            // 1. Verificar que la solicitud exista
            var solicitud = await _context.Solicitudes.FindAsync(id);
            if (solicitud == null)
                return NotFound("Solicitud no encontrada.");

            // 2. Asegurar carpeta de uploads
            //    OJO: _env.WebRootPath NO puede ser null
            var webRoot = _env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
            var uploadsPath = Path.Combine(webRoot, "uploads", "solicitudes", id.ToString());

            if (!Directory.Exists(uploadsPath))
                Directory.CreateDirectory(uploadsPath);

            // 3. Guardar archivo físico
            var safeFileName = Path.GetFileName(archivo.FileName).Replace(" ", "_");
            var filePath = Path.Combine(uploadsPath, safeFileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await archivo.CopyToAsync(stream);
            }

            // 4. Registrar en la tabla Documentos
            var documento = new Documento
            {
                Nombre = archivo.FileName,
                Tipo = archivo.ContentType,
                Ruta = $"/uploads/solicitudes/{id}/{safeFileName}",
                SolicitudId = id
            };

            _context.Documentos.Add(documento);
            await _context.SaveChangesAsync();

            // 5. Devolver el documento creado
            return Ok(documento);
        }

    }
}
