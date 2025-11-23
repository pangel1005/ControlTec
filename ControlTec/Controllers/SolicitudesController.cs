using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using ControlTec.Data;
using ControlTec.Models;
using ControlTec.Models.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ControlTec.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize] // todos requieren token
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
        // Helper: obtener el Id de usuario del token
        // ======================================
        private int GetUserIdFromToken()
        {
            // En el AuthController guardamos el Id en ClaimTypes.NameIdentifier
            var claim = User.FindFirst(ClaimTypes.NameIdentifier);

            if (claim == null)
                throw new Exception("No se encontró el Id de usuario en el token.");

            return int.Parse(claim.Value);
        }

        // ======================================
        // 0. INICIAR SOLICITUD (Usuario / Admin)
        // ======================================
        [HttpPost("iniciar")]
        [Authorize(Roles = "Usuario,Admin")]
        public async Task<ActionResult<object>> IniciarSolicitud([FromBody] IniciarSolicitudDto dto)
        {
            var userId = GetUserIdFromToken();

            var usuario = await _context.Usuarios.FindAsync(userId);
            if (usuario == null)
                return BadRequest("El usuario indicado no existe.");

            var servicio = await _context.Servicios
                .Include(s => s.DocumentosRequeridos)
                .FirstOrDefaultAsync(s => s.Id == dto.ServicioId);

            if (servicio == null)
                return BadRequest("El servicio indicado no existe.");

            var solicitud = new Solicitud
            {
                UsuarioId = userId,
                ServicioId = dto.ServicioId,
                Estado = "Pendiente",
                FechaCreacion = DateTime.Now
            };

            _context.Solicitudes.Add(solicitud);
            await _context.SaveChangesAsync();

            var historialInicial = new HistorialEstado
            {
                SolicitudId = solicitud.Id,
                EstadoAnterior = null,
                EstadoNuevo = "Pendiente",
                Comentario = "Solicitud iniciada desde el portal.",
                UsuarioId = userId,
                FechaCambio = DateTime.Now
            };

            _context.HistorialEstados.Add(historialInicial);
            await _context.SaveChangesAsync();

            var resultado = new
            {
                solicitud.Id,
                solicitud.Estado,
                solicitud.FechaCreacion,
                Usuario = new
                {
                    usuario.Id,
                    usuario.Nombre,
                    usuario.Correo,
                    usuario.Roll
                },
                Servicio = new
                {
                    servicio.Id,
                    servicio.Nombre,
                    servicio.Descripcion,
                    servicio.Costo,
                    servicio.RequierePago,
                    servicio.Activo
                },
                DocumentosRequeridos = servicio.DocumentosRequeridos?
                    .Select(dr => new { dr.Id, dr.Nombre })
                    .ToList()
            };

            return Ok(resultado);
        }

        // ======================================
        // 1. GET: TODAS LAS SOLICITUDES (ADMIN)
        // ======================================
        [HttpGet]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<IEnumerable<Solicitud>>> GetSolicitudes()
        {
            return await _context.Solicitudes
                .Include(s => s.Servicio)
                .Include(s => s.Usuario)
                .ToListAsync();
        }

        // ======================================
        // 1.b) GET: SOLICITUDES POR USUARIO
        // ======================================
        [HttpGet("usuario/{usuarioId}")]
        [Authorize(Roles = "Usuario,Admin")]
        public async Task<ActionResult<IEnumerable<object>>> GetSolicitudesPorUsuario(int usuarioId)
        {
            var currentUserId = GetUserIdFromToken();

            // Si no es admin, solo puede ver sus propias solicitudes
            if (!User.IsInRole("Admin") && usuarioId != currentUserId)
                return Forbid();

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
        // 2. POST genérico (solo Admin)
        // ======================================
        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<Solicitud>> PostSolicitud(Solicitud solicitud)
        {
            var usuario = await _context.Usuarios.FindAsync(solicitud.UsuarioId);
            if (usuario == null)
                return BadRequest("El usuario no existe.");

            var servicio = await _context.Servicios.FindAsync(solicitud.ServicioId);
            if (servicio == null)
                return BadRequest("El servicio no existe.");

            if (string.IsNullOrWhiteSpace(solicitud.Estado))
                solicitud.Estado = "Pendiente";

            if (solicitud.FechaCreacion == default)
                solicitud.FechaCreacion = DateTime.Now;

            _context.Solicitudes.Add(solicitud);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetSolicitudes), new { id = solicitud.Id }, solicitud);
        }

        // ======================================
        // 3. PUT (solo Admin)
        // ======================================
        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> PutSolicitud(int id, Solicitud solicitud)
        {
            if (id != solicitud.Id)
                return BadRequest("El id de la ruta no coincide con el del cuerpo.");

            var usuario = await _context.Usuarios.FindAsync(solicitud.UsuarioId);
            if (usuario == null)
                return BadRequest("El usuario no existe.");

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
                if (!_context.Solicitudes.Any(e => e.Id == id))
                    return NotFound();
                else
                    throw;
            }

            return NoContent();
        }

        // ======================================
        // 4. DELETE (solo Admin)
        // ======================================
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<Solicitud>> DeleteSolicitud(int id)
        {
            var solicitud = await _context.Solicitudes.FindAsync(id);
            if (solicitud == null)
                return NotFound();

            _context.Solicitudes.Remove(solicitud);
            await _context.SaveChangesAsync();

            return solicitud;
        }

        // ======================================
        // 5. DETALLE SOLICITUD (Usuario/Admin)
        // ======================================
        [HttpGet("{id}/detalle")]
        [Authorize(Roles = "Usuario,Admin")]
        public async Task<ActionResult<object>> GetDetalle(int id)
        {
            var solicitud = await _context.Solicitudes
                .Include(s => s.Usuario)
                .Include(s => s.Servicio).ThenInclude(s => s.DocumentosRequeridos)
                .Include(s => s.DocumentosCargados)
                .Include(s => s.HistorialEstados).ThenInclude(h => h.Usuario)
                .FirstOrDefaultAsync(s => s.Id == id);

            if (solicitud == null)
                return NotFound("Solicitud no encontrada.");

            var currentUserId = GetUserIdFromToken();
            if (!User.IsInRole("Admin") && solicitud.UsuarioId != currentUserId)
                return Forbid();

            var documentos = (solicitud.DocumentosCargados ?? new List<Documento>())
                .Select(d => new { d.Id, d.Nombre, d.Tipo, d.Ruta, d.SolicitudId })
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
                    .Select(dr => new { dr.Id, dr.Nombre })
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
        // 6. FILTRO (solo Admin)
        // ======================================
        [HttpGet("filtro")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<IEnumerable<object>>> GetSolicitudesFiltro(
            [FromQuery] string? estado,
            [FromQuery] int? servicioId,
            [FromQuery] int? usuarioId,
            [FromQuery] DateTime? fechaDesde,
            [FromQuery] DateTime? fechaHasta)
        {
            var query = _context.Solicitudes
                .Include(s => s.Usuario)
                .Include(s => s.Servicio)
                .Include(s => s.HistorialEstados).ThenInclude(h => h.Usuario)
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(estado))
                query = query.Where(s => s.Estado.ToLower() == estado.ToLower());

            if (servicioId.HasValue)
                query = query.Where(s => s.ServicioId == servicioId.Value);

            if (usuarioId.HasValue)
                query = query.Where(s => s.UsuarioId == usuarioId.Value);

            if (fechaDesde.HasValue)
            {
                var d = fechaDesde.Value.Date;
                query = query.Where(s => s.FechaCreacion >= d);
            }

            if (fechaHasta.HasValue)
            {
                var d = fechaHasta.Value.Date.AddDays(1).AddTicks(-1);
                query = query.Where(s => s.FechaCreacion <= d);
            }

            var lista = await query
                .OrderByDescending(s => s.FechaCreacion)
                .Select(s => new
                {
                    s.Id,
                    s.Estado,
                    s.FechaCreacion,
                    Usuario = s.Usuario == null ? null : new
                    {
                        s.Usuario.Id,
                        s.Usuario.Nombre,
                        s.Usuario.Correo,
                        s.Usuario.Roll
                    },
                    Servicio = s.Servicio == null ? null : new
                    {
                        s.Servicio.Id,
                        s.Servicio.Nombre
                    },
                    UltimoMovimiento = s.HistorialEstados
                        .OrderByDescending(h => h.FechaCambio)
                        .Select(h => new
                        {
                            h.EstadoAnterior,
                            h.EstadoNuevo,
                            h.Comentario,
                            h.FechaCambio,
                            Usuario = h.Usuario == null ? null : new
                            {
                                h.Usuario.Id,
                                h.Usuario.Nombre
                            }
                        })
                        .FirstOrDefault()
                })
                .ToListAsync();

            return Ok(lista);
        }

        // ======================================
        // 7. CAMBIAR ESTADO (solo Admin)
        // ======================================
        [HttpPost("{id}/cambiar-estado")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<object>> CambiarEstado(int id, CambiarEstadoSolicitudDto dto)
        {
            var solicitud = await _context.Solicitudes
                .Include(s => s.HistorialEstados)
                .FirstOrDefaultAsync(s => s.Id == id);

            if (solicitud == null)
                return NotFound("La solicitud no existe.");

            var userId = GetUserIdFromToken();

            var usuario = await _context.Usuarios.FindAsync(userId);
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
                UsuarioId = userId,
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
        // 8. SUBIR DOCUMENTO A SOLICITUD
        // ============================
        [HttpPost("{id}/documentos")]
        [Consumes("multipart/form-data")]
        [Authorize(Roles = "Usuario,Admin")]
        public async Task<ActionResult<Documento>> SubirDocumento(int id, IFormFile archivo)
        {
            if (archivo == null || archivo.Length == 0)
                return BadRequest("Debe seleccionar un archivo.");

            var solicitud = await _context.Solicitudes.FindAsync(id);
            if (solicitud == null)
                return NotFound("Solicitud no encontrada.");

            var currentUserId = GetUserIdFromToken();
            if (!User.IsInRole("Admin") && solicitud.UsuarioId != currentUserId)
                return Forbid();

            var webRoot = _env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
            var uploadsPath = Path.Combine(webRoot, "uploads", "solicitudes", id.ToString());

            if (!Directory.Exists(uploadsPath))
                Directory.CreateDirectory(uploadsPath);

            var safeFileName = Path.GetFileName(archivo.FileName).Replace(" ", "_");
            var filePath = Path.Combine(uploadsPath, safeFileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await archivo.CopyToAsync(stream);
            }

            var documento = new Documento
            {
                Nombre = archivo.FileName,
                Tipo = archivo.ContentType,
                Ruta = $"/uploads/solicitudes/{id}/{safeFileName}",
                SolicitudId = id
            };

            _context.Documentos.Add(documento);
            await _context.SaveChangesAsync();

            return Ok(documento);
        }

        // ======================================
        // 9. ENVIAR / DEPOSITAR SOLICITUD
        // ======================================
        [HttpPost("{id}/enviar")]
        [Authorize(Roles = "Usuario,Admin")]
        public async Task<ActionResult<object>> EnviarSolicitud(int id, EnviarSolicitudDto dto)
        {
            var solicitud = await _context.Solicitudes
                .Include(s => s.Servicio).ThenInclude(serv => serv.DocumentosRequeridos)
                .Include(s => s.DocumentosCargados)
                .Include(s => s.HistorialEstados)
                .FirstOrDefaultAsync(s => s.Id == id);

            if (solicitud == null)
                return NotFound("Solicitud no encontrada.");

            var currentUserId = GetUserIdFromToken();
            if (!User.IsInRole("Admin") && solicitud.UsuarioId != currentUserId)
                return Forbid();

            if (!string.Equals(solicitud.Estado, "Pendiente", StringComparison.OrdinalIgnoreCase)
                && !string.Equals(solicitud.Estado, "Borrador", StringComparison.OrdinalIgnoreCase))
            {
                return BadRequest($"La solicitud no está en un estado válido para ser enviada. Estado actual: '{solicitud.Estado}'.");
            }

            var usuario = await _context.Usuarios.FindAsync(currentUserId);
            if (usuario == null)
                return BadRequest("El usuario que envía la solicitud no existe.");

            var requeridos = solicitud.Servicio?.DocumentosRequeridos?.ToList()
                             ?? new List<DocumentoRequerido>();

            var cargados = solicitud.DocumentosCargados?.ToList()
                           ?? new List<Documento>();

            var nombresCargados = new HashSet<string>(
                cargados.Select(d => d.Nombre.Trim().ToLower())
            );

            var faltantes = requeridos
                .Where(dr => !nombresCargados.Contains(dr.Nombre.Trim().ToLower()))
                .Select(dr => dr.Nombre)
                .ToList();

            if (faltantes.Any())
            {
                return BadRequest(new
                {
                    mensaje = "No se puede enviar la solicitud. Faltan documentos obligatorios.",
                    documentosFaltantes = faltantes
                });
            }

            var estadoAnterior = solicitud.Estado;
            solicitud.Estado = "Depositada";

            var nuevoHistorial = new HistorialEstado
            {
                SolicitudId = solicitud.Id,
                EstadoAnterior = estadoAnterior,
                EstadoNuevo = solicitud.Estado,
                Comentario = string.IsNullOrWhiteSpace(dto.Comentario)
                    ? "Solicitud enviada por el usuario."
                    : dto.Comentario,
                UsuarioId = currentUserId,
                FechaCambio = DateTime.Now
            };

            _context.HistorialEstados.Add(nuevoHistorial);
            await _context.SaveChangesAsync();

            var resultado = new
            {
                solicitud.Id,
                solicitud.Estado,
                solicitud.FechaCreacion,
                Usuario = new
                {
                    usuario.Id,
                    usuario.Nombre,
                    usuario.Correo,
                    usuario.Roll
                },
                Servicio = solicitud.Servicio == null ? null : new
                {
                    solicitud.Servicio.Id,
                    solicitud.Servicio.Nombre
                },
                DocumentosCargados = cargados.Select(d => new
                {
                    d.Id,
                    d.Nombre,
                    d.Tipo,
                    d.Ruta
                }),
                Movimiento = new
                {
                    nuevoHistorial.Id,
                    nuevoHistorial.EstadoAnterior,
                    nuevoHistorial.EstadoNuevo,
                    nuevoHistorial.Comentario,
                    nuevoHistorial.FechaCambio
                }
            };

            return Ok(resultado);
        }
    }
}
