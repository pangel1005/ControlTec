using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using ControlTec.Data;
using ControlTec.Models; // Asegúrate de que la clase EstadosSolicitud esté en este namespace
using ControlTec.Models;
using ControlTec.Models.DTOs;
using ControlTec.Services;
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
        private readonly ICertificadoService _certificadoService;
        private readonly IComunicacionRechazoService _rechazoService;

        public SolicitudesController(
            AppDbContext context,
            IWebHostEnvironment env,
            ICertificadoService certificadoService,
            IComunicacionRechazoService rechazoService)
        {
            _context = context;
            _env = env;
            _certificadoService = certificadoService;
            _rechazoService = rechazoService;
        }

        // ==============================
        // Helpers internos
        // ==============================

        private int GetUserIdFromToken()
        {
            var claim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (claim == null)
                throw new Exception("No se encontró el Id de usuario en el token.");

            return int.Parse(claim.Value);
        }

        private class TransicionRol
        {
            public string Rol { get; set; } = null!;
            public string? Desde { get; set; }
            public string Hacia { get; set; } = null!;
        }

        

        // ==============================
        // Bandeja por rol (para el GET)
        // ==============================
        private static readonly Dictionary<string, string[]> EstadosPorRol = new()
        {
            // Ventanilla Única de Servicios
            { "VUS", new[]
                {
                    EstadosSolicitud.Depositada,   // cuando el usuario la envía
                    EstadosSolicitud.DepositadaFase1, // fase 1
                    EstadosSolicitud.DepositadaFase2, // fase 2
                    EstadosSolicitud.Devuelta      // cuando vuelve corregida
                    // NO ve ni RechazadaET ni Rechazada
                }
            },

            // Técnico UPC
            { "TecnicoUPC", new[]
                {
                    EstadosSolicitud.ValidacionRecepcion
                }
            },

            // Encargado UPC (DIGEAMPS)
            { "EncargadoUPC", new[]
                {
                    EstadosSolicitud.EvaluacionTecnica
                }
            },

            // DNCD
            { "DNCD", new[]
                {
                    EstadosSolicitud.AprobacionDIGEAMPS
                }
            },

            // Dirección
            { "Direccion", new[]
                {
                    // Solicitudes aprobadas por DNCD (para emitir certificado)
                    EstadosSolicitud.AprobacionDNCD,
                    // Rechazos internos de Evaluación Técnica (para comunicación de rechazo)
                    EstadosSolicitud.RechazadaET
                }
            }
        };

        // ======================================
        // 0. INICIAR SOLICITUD (Solicitante / Usuario / Admin)
        // ======================================
        [HttpPost("iniciar")]
        [Authorize(Roles = "Usuario,Solicitante,Admin")]
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


            // Estado inicial según servicio
            var estadoInicial = (dto.ServicioId == 4 || dto.ServicioId == 5)
                ? EstadosSolicitud.PendienteFase1 // Fase 1 para servicios 4 y 5
                : EstadosSolicitud.Pendiente;



            var solicitud = new Solicitud
            {
                UsuarioId = userId,
                ServicioId = dto.ServicioId,
                Estado = estadoInicial,
                FechaCreacion = DateTime.Now
            };

            _context.Solicitudes.Add(solicitud);
            await _context.SaveChangesAsync();

            var historialInicial = new HistorialEstado
            {
                SolicitudId = solicitud.Id,
                EstadoAnterior = null,
                EstadoNuevo = estadoInicial,
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
                    .Select(dr => new { dr.Id, dr.Nombre, dr.Fase })
                    .ToList()
            };

            return Ok(resultado);
        }

        // ======================================
        // 1. GET: SOLICITUDES SEGÚN EL ROL LOGUEADO (BANDEJA)
        // ======================================
        [HttpGet]
        public async Task<ActionResult<IEnumerable<object>>> GetSolicitudes()
        {
            var userId = GetUserIdFromToken();
            var rol = User.FindFirst(ClaimTypes.Role)?.Value ?? string.Empty;

            var query = _context.Solicitudes
                .Include(s => s.Servicio)
                .Include(s => s.Usuario)
                .AsQueryable();

            // 1) ADMIN -> ve todas
            if (string.Equals(rol, "Admin", StringComparison.OrdinalIgnoreCase))
            {
                // sin filtros extra
            }
            // 2) SOLICITANTE / USUARIO -> solo sus propias solicitudes
            else if (rol == "Solicitante" || rol == "Usuario")
            {
                query = query.Where(s => s.UsuarioId == userId);
            }
            // 3) ROLES INTERNOS -> por estado que les corresponde
            else if (EstadosPorRol.TryGetValue(rol, out var estadosAsignados))
            {
                query = query.Where(s => estadosAsignados.Contains(s.Estado));
            }
            else
            {
                return Forbid();
            }

            var lista = await query
                .OrderByDescending(s => s.FechaCreacion)
                .Select(s => new
                {
                    s.Id,
                    s.Estado,
                    s.FechaCreacion,
                    s.RutaCertificado,
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
                    }
                })
                .ToListAsync();

            return Ok(lista);
        }

        // ======================================
        // 1.b) GET: SOLICITUDES POR USUARIO
        // ======================================
        [HttpGet("usuario/{usuarioId}")]
        [Authorize(Roles = "Usuario,Solicitante,Admin")]
        public async Task<ActionResult<IEnumerable<object>>> GetSolicitudesPorUsuario(int usuarioId)
        {
            var currentUserId = GetUserIdFromToken();

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
                },
                s.RutaCertificado
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
        // 5. DETALLE SOLICITUD
        // ======================================
        [HttpGet("{id}/detalle")]
        [Authorize(Roles = "Usuario,Solicitante,Admin,VUS,TecnicoUPC,EncargadoUPC,DNCD,Direccion")]
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

            if (!User.IsInRole("Admin")
                && !User.IsInRole("VUS")
                && !User.IsInRole("TecnicoUPC")
                && !User.IsInRole("EncargadoUPC")
                && !User.IsInRole("DNCD")
                && !User.IsInRole("Direccion")
                && solicitud.UsuarioId != currentUserId)
            {
                return Forbid();
            }

            var documentos = (solicitud.DocumentosCargados ?? new List<Documento>())
                .Select(d => new { d.Id, d.Nombre, d.Tipo, d.Ruta, d.SolicitudId })
                .ToList();

            var resultado = new
            {
                solicitud.Id,
                solicitud.Estado,
                solicitud.FechaCreacion,
                solicitud.RutaCertificado,
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
                    s.RutaCertificado,
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
        // 7. CAMBIAR ESTADO
        // ======================================
        [HttpPost("{id}/cambiar-estado")]
        [Authorize(Roles = "Admin,VUS,TecnicoUPC,EncargadoUPC,DNCD,Direccion")]
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
            var estadoNuevo = dto.EstadoNuevo?.Trim();

            if (string.IsNullOrWhiteSpace(estadoNuevo))
                return BadRequest("Debe indicar el estado nuevo.");

            var rolUsuario = usuario.Roll?.Trim() ?? string.Empty;

            var transiciones = new List<TransicionRol>
            {
                // VUS (primera etapa)
                new TransicionRol { Rol = "VUS", Desde = EstadosSolicitud.Depositada, Hacia = EstadosSolicitud.Fase1Aprobada },
                new TransicionRol { Rol = "VUS", Desde = EstadosSolicitud.DepositadaFase1, Hacia = EstadosSolicitud.Fase1Aprobada },
                new TransicionRol { Rol = "VUS", Desde = EstadosSolicitud.Depositada, Hacia = EstadosSolicitud.Devuelta },
                new TransicionRol { Rol = "VUS", Desde = EstadosSolicitud.DepositadaFase1, Hacia = EstadosSolicitud.Devuelta },
                new TransicionRol { Rol = "VUS", Desde = EstadosSolicitud.Devuelta,  Hacia = EstadosSolicitud.ValidacionRecepcion },
                // Permitir que VUS pase de Fase2Aprobada a Validación Recepción
                new TransicionRol { Rol = "VUS", Desde = EstadosSolicitud.Fase2Aprobada, Hacia = EstadosSolicitud.ValidacionRecepcion },

                // Técnico UPC
                new TransicionRol { Rol = "TecnicoUPC", Desde = EstadosSolicitud.ValidacionRecepcion, Hacia = EstadosSolicitud.EvaluacionTecnica },
                new TransicionRol { Rol = "TecnicoUPC", Desde = EstadosSolicitud.ValidacionRecepcion, Hacia = EstadosSolicitud.Devuelta },
                new TransicionRol { Rol = "TecnicoUPC", Desde = EstadosSolicitud.ValidacionRecepcion, Hacia = EstadosSolicitud.Rechazada },

                // Encargado UPC (DIGEAMPS) – RF-2.3
                // Aprobado → Aprobación DIGEAMPS
                new TransicionRol { Rol = "EncargadoUPC", Desde = EstadosSolicitud.EvaluacionTecnica, Hacia = EstadosSolicitud.AprobacionDIGEAMPS },
                // NO aprobado → devuelve al usuario
                new TransicionRol { Rol = "EncargadoUPC", Desde = EstadosSolicitud.EvaluacionTecnica, Hacia = EstadosSolicitud.Devuelta },
                // Rechazo → queda en RechazadaET para que Dirección genere la comunicación
                new TransicionRol { Rol = "EncargadoUPC", Desde = EstadosSolicitud.EvaluacionTecnica, Hacia = EstadosSolicitud.RechazadaET },

                // DNCD
                new TransicionRol { Rol = "DNCD", Desde = EstadosSolicitud.AprobacionDIGEAMPS, Hacia = EstadosSolicitud.AprobacionDNCD },
                new TransicionRol { Rol = "DNCD", Desde = EstadosSolicitud.AprobacionDIGEAMPS, Hacia = EstadosSolicitud.Devuelta },
                // Rechazo directo desde DNCD → Rechazada final
                new TransicionRol { Rol = "DNCD", Desde = EstadosSolicitud.AprobacionDIGEAMPS, Hacia = EstadosSolicitud.Rechazada },

                // Dirección – recibe directamente desde DNCD para aprobación
                new TransicionRol { Rol = "Direccion", Desde = EstadosSolicitud.AprobacionDNCD, Hacia = EstadosSolicitud.Aprobada },
                new TransicionRol { Rol = "Direccion", Desde = EstadosSolicitud.AprobacionDNCD, Hacia = EstadosSolicitud.Devuelta },
                new TransicionRol { Rol = "Direccion", Desde = EstadosSolicitud.AprobacionDNCD, Hacia = EstadosSolicitud.Rechazada },

                // Admin – lo mismo que Dirección + Entregada
                new TransicionRol { Rol = "Admin", Desde = EstadosSolicitud.AprobacionDNCD, Hacia = EstadosSolicitud.Aprobada },
                new TransicionRol { Rol = "Admin", Desde = EstadosSolicitud.AprobacionDNCD, Hacia = EstadosSolicitud.Devuelta },
                new TransicionRol { Rol = "Admin", Desde = EstadosSolicitud.AprobacionDNCD, Hacia = EstadosSolicitud.Rechazada },
                new TransicionRol { Rol = "Admin", Desde = EstadosSolicitud.Aprobada,        Hacia = EstadosSolicitud.Entregada },
            };

            bool esAdmin = string.Equals(rolUsuario, "Admin", StringComparison.OrdinalIgnoreCase);
            bool transicionPermitida;

            if (esAdmin)
            {
                transicionPermitida = transiciones.Any(t =>
                    string.Equals(t.Hacia, estadoNuevo, StringComparison.OrdinalIgnoreCase));
            }
            else
            {
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

            solicitud.Estado = estadoNuevo;

            var comentario = dto.Comentario;
            if ((string.Equals(estadoNuevo, EstadosSolicitud.Rechazada, StringComparison.OrdinalIgnoreCase) ||
                 string.Equals(estadoNuevo, EstadosSolicitud.Devuelta, StringComparison.OrdinalIgnoreCase) ||
                 string.Equals(estadoNuevo, EstadosSolicitud.RechazadaET, StringComparison.OrdinalIgnoreCase)) &&
                string.IsNullOrWhiteSpace(comentario))
            {
                comentario = $"Solicitud {estadoNuevo} por el rol {rolUsuario}.";
            }

            var nuevoHistorial = new HistorialEstado
            {
                SolicitudId = solicitud.Id,
                EstadoAnterior = estadoAnterior,
                EstadoNuevo = estadoNuevo,
                Comentario = comentario,
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
        [Authorize(Roles = "Usuario,Solicitante,Admin")]
        public async Task<ActionResult<object>> EnviarSolicitud(int id, EnviarSolicitudDto dto)
        {
            var solicitud = await _context.Solicitudes
                .Include(s => s.Servicio)
                .Include(s => s.Usuario)
                .Include(s => s.DocumentosCargados)
                .Include(s => s.HistorialEstados)
                .FirstOrDefaultAsync(s => s.Id == id);

            if (solicitud == null)
                return NotFound("Solicitud no encontrada.");

            var currentUserId = GetUserIdFromToken();
            if (!User.IsInRole("Admin") && solicitud.UsuarioId != currentUserId)
                return Forbid();

            var estadoAnterior = solicitud.Estado;
            string nuevoEstado = null;

            if (solicitud.ServicioId == 4 || solicitud.ServicioId == 5)
            {
                if (solicitud.Estado == EstadosSolicitud.PendienteFase1)
                    nuevoEstado = EstadosSolicitud.DepositadaFase1;
                else if (solicitud.Estado == EstadosSolicitud.PendienteFase2)
                    nuevoEstado = EstadosSolicitud.DepositadaFase2;
                else
                    return BadRequest("No puedes enviar la solicitud en el estado actual para este servicio.");
            }
            else
            {
                if (solicitud.Estado == EstadosSolicitud.Pendiente || solicitud.Estado == EstadosSolicitud.Devuelta)
                    nuevoEstado = EstadosSolicitud.Depositada;
                else
                    return BadRequest("No puedes enviar la solicitud en el estado actual.");
            }

            solicitud.Estado = nuevoEstado;

            var comentario = string.IsNullOrWhiteSpace(dto.Comentario)
                ? "Solicitud enviada por el usuario."
                : dto.Comentario;

            var nuevoHistorial = new HistorialEstado
            {
                SolicitudId = solicitud.Id,
                EstadoAnterior = estadoAnterior,
                EstadoNuevo = nuevoEstado,
                Comentario = comentario,
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
                    solicitud.Servicio.Nombre
                },
                DocumentosCargados = solicitud.DocumentosCargados == null ? null :
                    solicitud.DocumentosCargados.Select(d => new
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

        // ======================================
        // 10. GENERAR CERTIFICADO (Dirección / Admin)
        // ======================================
        [HttpPost("{id}/certificado")]
        [Authorize(Roles = "Direccion,Admin")]
        public async Task<ActionResult<object>> GenerarCertificado(int id)
        {
            var solicitud = await _context.Solicitudes
                .Include(s => s.Usuario)
                .Include(s => s.Servicio)
                .FirstOrDefaultAsync(s => s.Id == id);

            if (solicitud == null)
                return NotFound("Solicitud no encontrada.");

            if (!string.Equals(solicitud.Estado, EstadosSolicitud.Aprobada, StringComparison.OrdinalIgnoreCase))
                return BadRequest("Solo se puede generar certificado cuando la solicitud está Aprobada.");

            var ruta = await _certificadoService.GenerarCertificadoAsync(id);

            return Ok(new
            {
                solicitud.Id,
                solicitud.Estado,
                RutaCertificado = ruta
            });
        }

        // ==============================
        // APROBAR FASES PARA SERVICIOS 4 Y 5 (VUS/Admin)
        // ==============================

        [Authorize(Roles = "VUS,Admin")]
        [HttpPost("{solicitudId}/aprobar-fase1")]
        public async Task<IActionResult> AprobarFase1(int solicitudId)
        {
            var solicitud = await _context.Solicitudes.FindAsync(solicitudId);
            if (solicitud == null) return NotFound();

            if (solicitud.Estado != EstadosSolicitud.DepositadaFase1)
                return BadRequest("No está en la fase 1.");

            // Aprueba Fase 1
            solicitud.Estado = EstadosSolicitud.Fase1Aprobada;
            await _context.SaveChangesAsync();

            // Inicia Fase 2
            solicitud.Estado = EstadosSolicitud.PendienteFase2;
            await _context.SaveChangesAsync();

            return Ok(new { mensaje = "Fase 1 aprobada. Ahora el usuario puede subir y enviar documentos de Fase 2." });
        }

        // POST: api/Solicitudes/{solicitudId}/aprobar-fase2
        [Authorize(Roles = "VUS,Admin")]
        [HttpPost("{solicitudId}/aprobar-fase2")]
        public async Task<IActionResult> AprobarFase2(int solicitudId)
        {
            var solicitud = await _context.Solicitudes.FindAsync(solicitudId);
            if (solicitud == null) return NotFound();

            if (solicitud.Estado != EstadosSolicitud.DepositadaFase2)
                return BadRequest("No está en la fase 2.");

            solicitud.Estado = EstadosSolicitud.Fase2Aprobada;
            await _context.SaveChangesAsync();
            return Ok(new { mensaje = "Fase 2 aprobada. Continúa el flujo normal." });
        }

        // ======================================
        // 11. GENERAR COMUNICACIÓN DE RECHAZO (Dirección / Admin)
        //      Requisito RF-2.3: cuando la evaluación técnica resulta NO Aprobada
        // ======================================
        [HttpPost("{id}/comunicacion-rechazo")]
        [Authorize(Roles = "Direccion,Admin")]
        public async Task<ActionResult<object>> GenerarComunicacionRechazo(int id)
        {
            var solicitud = await _context.Solicitudes
                .Include(s => s.Usuario)
                .Include(s => s.Servicio)
                .FirstOrDefaultAsync(s => s.Id == id);

            if (solicitud == null)
                return NotFound("Solicitud no encontrada.");

            // Solo se permite generar la comunicación cuando está en RechazadaET
            if (!string.Equals(solicitud.Estado, EstadosSolicitud.RechazadaET, StringComparison.OrdinalIgnoreCase))
                return BadRequest("Solo se puede generar la comunicación de rechazo para solicitudes en estado RechazadaET.");

            var usuarioId = GetUserIdFromToken();
            var usuario = await _context.Usuarios.FindAsync(usuarioId);
            if (usuario == null)
                return BadRequest("El usuario que genera la comunicación no existe.");

            // Generar el PDF de comunicación de rechazo
            var ruta = await _rechazoService.GenerarComunicacionRechazoAsync(id);

            // Pasar de RechazadaET -> Rechazada (estado final visible al usuario)
            var estadoAnterior = solicitud.Estado;
            solicitud.Estado = EstadosSolicitud.Rechazada;

            var comentario = $"Comunicación de rechazo generada por {usuario.Roll}.";

            var nuevoHistorial = new HistorialEstado
            {
                SolicitudId = solicitud.Id,
                EstadoAnterior = estadoAnterior,
                EstadoNuevo = solicitud.Estado,
                Comentario = comentario,
                UsuarioId = usuarioId,
                FechaCambio = DateTime.Now
            };

            _context.HistorialEstados.Add(nuevoHistorial);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                solicitud.Id,
                solicitud.Estado,
                RutaComunicacionRechazo = ruta,
                Historial = new
                {
                    nuevoHistorial.Id,
                    nuevoHistorial.EstadoAnterior,
                    nuevoHistorial.EstadoNuevo,
                    nuevoHistorial.Comentario,
                    nuevoHistorial.FechaCambio
                }
            });
        }
    }
}
