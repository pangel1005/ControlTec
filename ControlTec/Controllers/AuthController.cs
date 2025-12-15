using System;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
using ControlTec.Data;
using ControlTec.Models;
using ControlTec.Models.DTOs;
using ControlTec.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace ControlTec.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IConfiguration _configuration;
        private readonly IEmailService _emailService;

        public AuthController(AppDbContext context, IConfiguration configuration, IEmailService emailService)
        {
            _context = context;
            _configuration = configuration;
            _emailService = emailService;
        }

        // ============================
        // POST: api/Auth/login
        // ============================
        [HttpPost("login")]
        [AllowAnonymous]
        public async Task<IActionResult> Login([FromBody] LoginRequest model)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var user = await _context.Usuarios
                .FirstOrDefaultAsync(u =>
                    u.Correo == model.Correo &&
                    u.Contraseña == model.Password);

            if (user == null)
                return Unauthorized("Correo o contraseña incorrectos.");

            if (!user.Activo)
                return Unauthorized("El usuario no está activo. Contacte al administrador.");

            var codigo = new Random().Next(100000, 999999).ToString();
            user.CodigoVerificacion = codigo;
            user.CodigoVerificacionExpira = DateTime.UtcNow.AddMinutes(10);
            await _context.SaveChangesAsync();

            await _emailService.SendConfirmationEmail(user.Correo, $"Tu código de verificación es: {codigo}");

            return Ok(new
            {
                requiereCodigo = true,
                mensaje = "Se ha enviado un código de verificación a tu correo electrónico.",
                correo = user.Correo
            });
        }

        // ============================
        // POST: api/Auth/register
        // ============================
        [HttpPost("register")]
        [AllowAnonymous]
        public async Task<IActionResult> Register([FromBody] RegistroUsuarioDto model)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var existeCorreo = await _context.Usuarios
                .AnyAsync(u => u.Correo == model.Correo);

            if (existeCorreo)
                return BadRequest("Ya existe un usuario registrado con ese correo.");

            if (string.IsNullOrWhiteSpace(model.Cedula) ||
                model.Cedula.Length != 11 ||
                !long.TryParse(model.Cedula, out _))
            {
                return BadRequest("La cédula debe tener exactamente 11 dígitos numéricos.");
            }

            var tipo = (model.TipoUsuario ?? "Solicitante").Trim().ToLower();
            string rolInicial;
            bool activo;
            bool esInternoPendiente;

            if (tipo == "interno")
            {
                rolInicial = "Pendiente";
                activo = false;
                esInternoPendiente = true;
            }
            else
            {
                rolInicial = "Solicitante";
                activo = true;
                esInternoPendiente = false;
            }

            var token = Guid.NewGuid().ToString();
            var expiracion = DateTime.UtcNow.AddHours(24);

            var nuevoUsuario = new Usuario
            {
                Nombre = model.Nombre,
                Correo = model.Correo,
                Contraseña = model.Password,
                Roll = rolInicial,
                Activo = activo,
                EsInternoPendiente = esInternoPendiente,
                Cedula = model.Cedula,
                EmailConfirmacionToken = token,
                EmailConfirmacionExpira = expiracion,
                EmailConfirmado = false
            };

            _context.Usuarios.Add(nuevoUsuario);
            await _context.SaveChangesAsync();

            string link = $"http://localhost:5232/api/Auth/confirmar?token={token}";
            await _emailService.SendConfirmationEmail(nuevoUsuario.Correo, link);

            return Ok(new
            {
                mensaje = "Usuario registrado correctamente. Por favor revisa tu correo para confirmar tu cuenta.",
                usuario = new
                {
                    nuevoUsuario.Id,
                    nuevoUsuario.Nombre,
                    nuevoUsuario.Correo,
                    nuevoUsuario.Roll,
                    nuevoUsuario.Cedula,
                    nuevoUsuario.Activo,
                    nuevoUsuario.EsInternoPendiente,
                    TipoUsuario = tipo,
                    RolInternoDeseado = model.RolInternoDeseado
                }
            });
        }

        // ============================
        // POST: api/Auth/aprobar-interno/{id}
        // ============================
        [HttpPost("aprobar-interno/{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> AprobarInterno(int id, [FromBody] AprobarInternoDto dto)
        {
            var usuario = await _context.Usuarios.FindAsync(id);
            if (usuario == null)
                return NotFound("Usuario no encontrado.");

            if (!usuario.EsInternoPendiente)
                return BadRequest("Este usuario no está marcado como interno pendiente.");

            if (string.IsNullOrWhiteSpace(dto.NuevoRol))
                return BadRequest("Debe indicar el rol final para el usuario interno.");

            usuario.Roll = dto.NuevoRol.Trim();
            usuario.Activo = true;
            usuario.EsInternoPendiente = false;
            await _context.SaveChangesAsync();

            return Ok(new
            {
                mensaje = "Usuario interno aprobado y activado correctamente.",
                usuario = new
                {
                    usuario.Id,
                    usuario.Nombre,
                    usuario.Correo,
                    usuario.Roll,
                    usuario.Cedula,
                    usuario.Activo,
                    usuario.EsInternoPendiente
                }
            });
        }

        // ============================
        // GET: api/Auth/me
        // ============================
        [HttpGet("me")]
        [Authorize]
        public IActionResult Me()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var nombre = User.FindFirstValue(ClaimTypes.Name);
            var correo = User.FindFirstValue(ClaimTypes.Email);
            var rol = User.FindFirstValue(ClaimTypes.Role);

            return Ok(new
            {
                Id = userId,
                Nombre = nombre,
                Correo = correo,
                Roll = rol
            });
        }

        // ============================
        // GET: api/Auth/confirmar?token=XYZ
        // ============================
        [HttpGet("confirmar")]
        [AllowAnonymous]
        public async Task<IActionResult> ConfirmarEmail([FromQuery] string token)
        {
            try
            {
                Console.WriteLine($"[DEBUG] Token recibido: {token}");
                if (string.IsNullOrWhiteSpace(token))
                    return BadRequest("Token de confirmación inválido.");

                var usuario = await _context.Usuarios.FirstOrDefaultAsync(u => u.EmailConfirmacionToken == token);
                Console.WriteLine($"[DEBUG] Usuario encontrado: {(usuario != null ? usuario.Correo : "null")}");
                if (usuario == null)
                    return BadRequest("Token no válido o usuario no encontrado.");

                if (usuario.EmailConfirmado)
                    return BadRequest("La cuenta ya está confirmada.");

                if (usuario.EmailConfirmacionExpira < DateTime.UtcNow)
                    return BadRequest("El token de confirmación ha expirado.");

                usuario.EmailConfirmado = true;
                usuario.FechaEmailConfirmado = DateTime.UtcNow;
                usuario.EmailConfirmacionToken = null;
                usuario.EmailConfirmacionExpira = null;
                usuario.Activo = true;
                await _context.SaveChangesAsync();

                Console.WriteLine($"[DEBUG] Usuario confirmado: {usuario.Correo}");
                return Ok(new { mensaje = "¡Cuenta confirmada correctamente! Ya puedes iniciar sesión." });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[ERROR] {ex}");
                return StatusCode(500, "Error interno en el backend.");
            }
        }

        // ============================
        // POST: api/Auth/verificar-codigo
        // ============================
        [HttpPost("verificar-codigo")]
        [AllowAnonymous]
        public async Task<IActionResult> VerificarCodigo([FromBody] VerificarCodigoDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Correo) || string.IsNullOrWhiteSpace(dto.Codigo))
                return BadRequest("Correo y código requeridos.");

            var user = await _context.Usuarios.FirstOrDefaultAsync(u => u.Correo == dto.Correo);
            if (user == null)
                return Unauthorized("Usuario no encontrado.");
            if (user.CodigoVerificacion != dto.Codigo)
                return Unauthorized("Código incorrecto.");
            if (user.CodigoVerificacionExpira < DateTime.UtcNow)
                return Unauthorized("El código ha expirado.");

            user.CodigoVerificacion = null;
            user.CodigoVerificacionExpira = null;
            await _context.SaveChangesAsync();

            var claims = new[]
            {
                new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Name, user.Nombre),
                new Claim(ClaimTypes.Email, user.Correo),
                new Claim(ClaimTypes.Role, user.Roll ?? string.Empty)
            };
            var key = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(_configuration["Jwt:SecretKey"]!)
            );
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
            var token = new JwtSecurityToken(
                issuer: _configuration["Jwt:Issuer"],
                audience: _configuration["Jwt:Audience"],
                claims: claims,
                expires: DateTime.UtcNow.AddHours(1),
                signingCredentials: creds
            );
            var tokenString = new JwtSecurityTokenHandler().WriteToken(token);

            return Ok(new
            {
                token = tokenString,
                usuario = new
                {
                    user.Id,
                    user.Nombre,
                    user.Correo,
                    user.Roll,
                    user.Cedula,
                    user.Activo,
                    user.EsInternoPendiente
                }
            });
        }

        public class VerificarCodigoDto
        {
            public string Correo { get; set; } = null!;
            public string Codigo { get; set; } = null!;
        }

        public class LoginRequest
        {
            public string Correo { get; set; } = null!;
            public string Password { get; set; } = null!;
        }
    }
}
