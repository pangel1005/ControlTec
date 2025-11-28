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
using Microsoft.AspNetCore.Hosting;
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

        // ==============================
        // Helpers internos
        // ==============================

        // Helper: obtener el Id de usuario del token
        private int GetUserIdFromToken()
        {
            var claim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (claim == null)
                throw new Exception("No se encontró el Id de usuario en el token.");

            return int.Parse(claim.Value);
        }

        // Clase helper para transiciones por rol
        private class TransicionRol
        {
            public string Rol { get; set; } = null!;
            public string? Desde { get; set; }
            public string Hacia { get; set; } = null!;
        }

        // Catálogo de nombres de estados para evitar errores de escritura
        private static class EstadosSolicitud
        {
            public const string Pendiente = "Pendiente";
            public const string Depositada = "Depositada";
            public const string ValidacionRecepcion = "Validación Recepción";
            public const string EvaluacionTecnica = "Evaluación Técnica";
            public const string AprobacionDIGEAMPS = "Aprobación DIGEAMPS";
            public const string AprobacionDNCD = "Aprobación DNCD";
            public const string RevisionVUS = "Revisión VUS";
            public const string Aprobada = "Aprobada";
            public const string Rechazada = "Rechazada";
            public const string Entregada = "Entregada";
        }

        // ======================================
        // 0. INICIAR SOLICITUD (Solicitante / Usuario / Admin)
        // Usa SP: sp_CrearSolicitud
        // ======================================
        [HttpPost("iniciar")]
        [Authorize(Roles = "Usuario,Solicitante,Admin")]
        public async Task<ActionResult<object>> IniciarSolicitud([FromBody] IniciarSolicitudDto dto)
        {
            var userId = GetUserIdFromToken();

            // Validar usuario y servicio igual que antes
            var usuario = await _context.Usuarios.FindAsync(userId);
            if (usuario == null)
                return BadRequest("El usuario indicado no existe.");

            var servicio = await _context.Servicios
                .Include(s => s.DocumentosRequeridos)
                .FirstOrDefaultAsync(s => s.Id == dto.ServicioId);

            if (servicio == null)
                return BadRequest("El servicio indicado no existe.");

            // Usar SP para crear la solicitud + historial inicial
            // SP: sp_CrearSolicitud @UsuarioId, @ServicioId, @Comentario
            var solicitudCreada = await _context.Solicitudes
                .FromSqlRaw(
                    "EXEC sp_CrearSolicitud {0}, {1}, {2}",
                    userId,
                    dto.ServicioId,
                    (object?)null // sin comentario inicial extra
                )
                .AsNoTracking()
                .FirstOrDefaultAsync();

            if (solicitudCreada == null)
                return StatusCode(500, "No se pudo crear la solicitud mediante el procedimiento almacenado.");

            var resultado = new
            {
                solicitudCreada.Id,
                solicitudCreada.Estado,
                solicitudCreada.FechaCreacion,
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
        // 1. GET: TODAS LAS SOLICITUDES (solo Admin)
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
        // (aquí podemos seguir con LINQ; SP es opcional)
        // ======================================
        [HttpGet("usuario/{usuarioId}")]
        [Authorize(Roles = "Usuario,Solicitante,Admin")]
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
        // (puede quedar con EF normal)
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
                solicitud.Estado = EstadosSolicitud.Pendiente;

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
        // 5. DETALLE SOLICITUD (Solicitante/Admin)
        // ======================================
        [HttpGet("{id}/detalle")]
        [Authorize(Roles = "Usuario,Solicitante,Admin")]
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
        // (se puede quedar con LINQ; SP es opcional)
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
        // 7. CAMBIAR ESTADO (roles internos + rechazados)
        // Usa SP: sp_CambiarEstado
        // ======================================
        [HttpPost("{id}/cambiar-estado")]
        [Authorize(Roles = "Admin,EncargadoUPC,TecnicoUPC,Analista,DNCD,VUS,Direccion")]
        public async Task<ActionResult<object>> CambiarEstado(int id, CambiarEstadoSolicitudDto dto)
        {
            var solicitud = await _context.Solicitudes
                .FirstOrDefaultAsync(s => s.Id == id);

            if (solicitud == null)
                return NotFound("La solicitud no existe.");

            var userId = GetUserIdFromToken();
            var usuario = await _context.Usuarios.FindAsync(userId);
            if (usuario == null)
                return BadRequest("El usuario que realiza el cambio no existe.");

            var estadoAnterior = solicitud.Estado;
            var estadoNuevo = dto.EstadoNuevo?.Trim();

            if (string.IsNullOrWhiteSpace(estadoNuevo))
                return BadRequest("Debe indicar el estado nuevo.");

            var rolUsuario = usuario.Roll?.Trim() ?? string.Empty;

            // Catálogo de transiciones permitidas por rol
            var transiciones = new List<TransicionRol>
            {
                // Encargado UPC
                new TransicionRol
                {
                    Rol   = "EncargadoUPC",
                    Desde = EstadosSolicitud.Depositada,
                    Hacia = EstadosSolicitud.ValidacionRecepcion
                },
                new TransicionRol
                {
                    Rol   = "EncargadoUPC",
                    Desde = EstadosSolicitud.Depositada,
                    Hacia = EstadosSolicitud.Rechazada
                },

                // Técnico UPC
                new TransicionRol
                {
                    Rol   = "TecnicoUPC",
                    Desde = EstadosSolicitud.ValidacionRecepcion,
                    Hacia = EstadosSolicitud.EvaluacionTecnica
                },
                new TransicionRol
                {
                    Rol   = "TecnicoUPC",
                    Desde = EstadosSolicitud.ValidacionRecepcion,
                    Hacia = EstadosSolicitud.Rechazada
                },

                // Analista (DIGEAMPS)
                new TransicionRol
                {
                    Rol   = "Analista",
                    Desde = EstadosSolicitud.EvaluacionTecnica,
                    Hacia = EstadosSolicitud.AprobacionDIGEAMPS
                },
                new TransicionRol
                {
                    Rol   = "Analista",
                    Desde = EstadosSolicitud.EvaluacionTecnica,
                    Hacia = EstadosSolicitud.Rechazada
                },

                // DNCD
                new TransicionRol
                {
                    Rol   = "DNCD",
                    Desde = EstadosSolicitud.AprobacionDIGEAMPS,
                    Hacia = EstadosSolicitud.AprobacionDNCD
                },
                new TransicionRol
                {
                    Rol   = "DNCD",
                    Desde = EstadosSolicitud.AprobacionDIGEAMPS,
                    Hacia = EstadosSolicitud.Rechazada
                },

                // VUS
                new TransicionRol
                {
                    Rol   = "VUS",
                    Desde = EstadosSolicitud.AprobacionDNCD,
                    Hacia = EstadosSolicitud.RevisionVUS
                },
                new TransicionRol
                {
                    Rol   = "VUS",
                    Desde = EstadosSolicitud.AprobacionDNCD,
                    Hacia = EstadosSolicitud.Rechazada
                },

                // Dirección
                new TransicionRol
                {
                    Rol   = "Direccion",
                    Desde = EstadosSolicitud.RevisionVUS,
                    Hacia = EstadosSolicitud.Aprobada
                },
                new TransicionRol
                {
                    Rol   = "Direccion",
                    Desde = EstadosSolicitud.RevisionVUS,
                    Hacia = EstadosSolicitud.Rechazada
                },

                // Admin: puede aprobar o rechazar desde revisión VUS
                new TransicionRol
                {
                    Rol   = "Admin",
                    Desde = EstadosSolicitud.RevisionVUS,
                    Hacia = EstadosSolicitud.Aprobada
                },
                new TransicionRol
                {
                    Rol   = "Admin",
                    Desde = EstadosSolicitud.RevisionVUS,
                    Hacia = EstadosSolicitud.Rechazada
                },
                // Admin: marcar como entregada
                new TransicionRol
                {
                    Rol   = "Admin",
                    Desde = EstadosSolicitud.Aprobada,
                    Hacia = EstadosSolicitud.Entregada
                },
            };

            bool esAdmin = string.Equals(rolUsuario, "Admin", StringComparison.OrdinalIgnoreCase);
            bool transicionPermitida;

            if (esAdmin)
            {
                // Admin puede usar cualquiera de las transiciones definidas
                transicionPermitida = transiciones.Any(t =>
                    string.Equals(t.Hacia, estadoNuevo, StringComparison.OrdinalIgnoreCase));
            }
            else
            {
                // Resto de roles: solo sus transiciones específicas
                transicionPermitida = transiciones.Any(t =>
                    string.Equals(t.Rol, rolUsuario, StringComparison.OrdinalIgnoreCase) &&
                    string.Equals(t.Desde ?? string.Empty,
                                  estadoAnterior ?? string.Empty,
                                  StringComparison.OrdinalIgnoreCase) &&
                    string.Equals(t.Hacia, estadoNuevo, StringComparison.OrdinalIgnoreCase));
            }

            if (!transicionPermitida)
            {
                return BadRequest(
                    $"El rol '{rolUsuario}' no puede cambiar la solicitud de '{estadoAnterior}' a '{estadoNuevo}'.");
            }

            // Comentario final (si es rechazo y no mandaron comentario, le ponemos uno)
            var comentario = dto.Comentario;
            if (string.Equals(estadoNuevo, EstadosSolicitud.Rechazada, StringComparison.OrdinalIgnoreCase) &&
                string.IsNullOrWhiteSpace(comentario))
            {
                comentario = $"Solicitud rechazada por el rol {rolUsuario}.";
            }

            // Usar SP para cambiar estado + historial
            await _context.Database.ExecuteSqlRawAsync(
                "EXEC sp_CambiarEstado {0}, {1}, {2}, {3}",
                id,
                estadoNuevo,
                comentario ?? string.Empty,
                userId
            );

            // Recargar estado y último historial para armar la respuesta
            var solicitudActualizada = await _context.Solicitudes.FindAsync(id);
            var ultimoHistorial = await _context.HistorialEstados
                .Where(h => h.SolicitudId == id)
                .OrderByDescending(h => h.FechaCambio)
                .FirstOrDefaultAsync();

            var resultado = new
            {
                solicitudActualizada?.Id,
                EstadoAnterior = estadoAnterior,
                EstadoNuevo = solicitudActualizada?.Estado,
                Historial = ultimoHistorial == null ? null : new
                {
                    ultimoHistorial.Id,
                    ultimoHistorial.Comentario,
                    ultimoHistorial.FechaCambio,
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
        // Usa SP: sp_SubirDocumento para guardar en BD
        // ============================
        [HttpPost("{id}/documentos")]
        [Consumes("multipart/form-data")]
        [Authorize(Roles = "Usuario,Solicitante,Admin")]
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

            var rutaDb = $"/uploads/solicitudes/{id}/{safeFileName}";

            // Usar SP para insertar el documento en la BD
            var documentos = await _context.Documentos
                .FromSqlRaw(
                    "EXEC sp_SubirDocumento {0}, {1}, {2}, {3}",
                    id,
                    archivo.FileName,
                    archivo.ContentType,
                    rutaDb
                )
                .ToListAsync();

            var documento = documentos.FirstOrDefault();
            if (documento == null)
            {
                // fallback por si algo falla en el SP
                documento = new Documento
                {
                    Nombre = archivo.FileName,
                    Tipo = archivo.ContentType,
                    Ruta = rutaDb,
                    SolicitudId = id
                };
            }

            return Ok(documento);
        }

        // ======================================
        // 9. ENVIAR / DEPOSITAR SOLICITUD
        // Usa SP: sp_CambiarEstado para pasar a Depositada
        // ======================================
        [HttpPost("{id}/enviar")]
        [Authorize(Roles = "Usuario,Solicitante,Admin")]
        public async Task<ActionResult<object>> EnviarSolicitud(int id, EnviarSolicitudDto dto)
        {
            var solicitud = await _context.Solicitudes
                .Include(s => s.Servicio)
                .Include(s => s.DocumentosCargados)
                .FirstOrDefaultAsync(s => s.Id == id);

            if (solicitud == null)
                return NotFound("Solicitud no encontrada.");

            var currentUserId = GetUserIdFromToken();
            if (!User.IsInRole("Admin") && solicitud.UsuarioId != currentUserId)
                return Forbid();

            if (!string.Equals(solicitud.Estado, EstadosSolicitud.Pendiente, StringComparison.OrdinalIgnoreCase) &&
                !string.Equals(solicitud.Estado, "Borrador", StringComparison.OrdinalIgnoreCase))
            {
                return BadRequest($"La solicitud no está en un estado válido para ser enviada. Estado actual: '{solicitud.Estado}'.");
            }

            var usuario = await _context.Usuarios.FindAsync(currentUserId);
            if (usuario == null)
                return BadRequest("El usuario que envía la solicitud no existe.");

            var cargados = solicitud.DocumentosCargados?.ToList()
                           ?? new List<Documento>();

            var comentario = string.IsNullOrWhiteSpace(dto.Comentario)
                ? "Solicitud enviada por el usuario."
                : dto.Comentario;

            // Usar SP para pasar a 'Depositada' y crear historial
            await _context.Database.ExecuteSqlRawAsync(
                "EXEC sp_CambiarEstado {0}, {1}, {2}, {3}",
                id,
                EstadosSolicitud.Depositada,
                comentario,
                currentUserId
            );

            // Recargar la solicitud e historial
            var solicitudActualizada = await _context.Solicitudes
                .Include(s => s.Servicio)
                .FirstOrDefaultAsync(s => s.Id == id);

            var ultimoHistorial = await _context.HistorialEstados
                .Where(h => h.SolicitudId == id)
                .OrderByDescending(h => h.FechaCambio)
                .FirstOrDefaultAsync();

            var resultado = new
            {
                solicitudActualizada?.Id,
                solicitudActualizada?.Estado,
                solicitudActualizada?.FechaCreacion,
                Usuario = new
                {
                    usuario.Id,
                    usuario.Nombre,
                    usuario.Correo,
                    usuario.Roll
                },
                Servicio = solicitudActualizada?.Servicio == null ? null : new
                {
                    solicitudActualizada.Servicio.Id,
                    solicitudActualizada.Servicio.Nombre
                },
                DocumentosCargados = cargados.Select(d => new
                {
                    d.Id,
                    d.Nombre,
                    d.Tipo,
                    d.Ruta
                }),
                Movimiento = ultimoHistorial == null ? null : new
                {
                    ultimoHistorial.Id,
                    EstadoAnterior = ultimoHistorial.EstadoAnterior,
                    EstadoNuevo = ultimoHistorial.EstadoNuevo,
                    ultimoHistorial.Comentario,
                    ultimoHistorial.FechaCambio
                }
            };

            return Ok(resultado);
        }
    }
}
