using System;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
using System.Security.Cryptography;
using System.Linq;

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
        private readonly EmailService _emailService;

        public AuthController(
            AppDbContext context,
            IConfiguration configuration,
            EmailService emailService)
        {
            _context = context;
            _configuration = configuration;
            _emailService = emailService;
        }

        // ============================
        // Helpers
        // ============================
        private static string Sha256(string input)
        {
            using var sha = SHA256.Create();
            var bytes = sha.ComputeHash(Encoding.UTF8.GetBytes(input));
            return Convert.ToHexString(bytes).ToLower(); // 64 chars
        }

        private static string GenerarCodigo6()
        {
            var n = RandomNumberGenerator.GetInt32(0, 1000000);
            return n.ToString("D6");
        }

        private string CrearJwt(Usuario user)
        {
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

            return new JwtSecurityTokenHandler().WriteToken(token);
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

            var existeCorreo = await _context.Usuarios.AnyAsync(u => u.Correo == model.Correo);
            if (existeCorreo)
                return BadRequest("Ya existe un usuario registrado con ese correo.");

            // Validar cédula (11 dígitos)
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

            // 🔐 Confirmación de correo
            var tokenConfirmacion = Guid.NewGuid().ToString("N");

            var nuevoUsuario = new Usuario
            {
                Nombre = model.Nombre,
                Correo = model.Correo,
                Contraseña = model.Password, // ⚠️ luego hash
                Roll = rolInicial,
                Activo = activo,
                EsInternoPendiente = esInternoPendiente,
                Cedula = model.Cedula,

                EmailConfirmado = false,
                EmailConfirmacionToken = tokenConfirmacion,
                EmailConfirmacionExpira = DateTime.UtcNow.AddHours(24),
                FechaEmailConfirmado = null
            };

            _context.Usuarios.Add(nuevoUsuario);
            await _context.SaveChangesAsync();

            var frontBaseUrl = _configuration["App:FrontendBaseUrl"] ?? "https://localhost:5173";
            var link = $"{frontBaseUrl}/confirm-email?correo={Uri.EscapeDataString(nuevoUsuario.Correo)}&token={Uri.EscapeDataString(tokenConfirmacion)}";

            await _emailService.SendAsync(
                nuevoUsuario.Correo,
                "Confirma tu correo - ControlTec",
                $@"
                <p>Hola {nuevoUsuario.Nombre},</p>
                <p>Para activar tu cuenta, confirma tu correo aquí:</p>
                <p><a href=""{link}"">Confirmar correo</a></p>
                <p>Este enlace vence en 24 horas.</p>"
            );

            return Ok(new
            {
                mensaje = "Usuario registrado. Revisa tu correo para confirmar la cuenta.",
                usuario = new
                {
                    nuevoUsuario.Id,
                    nuevoUsuario.Nombre,
                    nuevoUsuario.Correo,
                    nuevoUsuario.Roll,
                    nuevoUsuario.Cedula,
                    nuevoUsuario.Activo,
                    nuevoUsuario.EsInternoPendiente,
                    EmailConfirmado = nuevoUsuario.EmailConfirmado,
                    TipoUsuario = tipo,
                    RolInternoDeseado = model.RolInternoDeseado
                }
            });
        }

        // ============================
        // GET: api/Auth/confirm-email
        // ============================
        [HttpGet("confirm-email")]
        [AllowAnonymous]
        public async Task<IActionResult> ConfirmEmail([FromQuery] string correo, [FromQuery] string token)
        {
            var user = await _context.Usuarios.FirstOrDefaultAsync(u => u.Correo == correo);
            if (user == null)
                return NotFound("Usuario no encontrado.");

            if (user.EmailConfirmado)
                return Ok("El correo ya fue confirmado.");

            if (user.EmailConfirmacionToken != token ||
                user.EmailConfirmacionExpira == null ||
                DateTime.UtcNow > user.EmailConfirmacionExpira)
            {
                return BadRequest("Token inválido o expirado.");
            }

            user.EmailConfirmado = true;
            user.FechaEmailConfirmado = DateTime.UtcNow;
            user.EmailConfirmacionToken = null;
            user.EmailConfirmacionExpira = null;

            await _context.SaveChangesAsync();

            return Ok("Correo confirmado correctamente.");
        }

        // ============================
        // POST: api/Auth/resend-confirmation
        // ============================
        [HttpPost("resend-confirmation")]
        [AllowAnonymous]
        public async Task<IActionResult> ResendConfirmation([FromBody] string correo)
        {
            var user = await _context.Usuarios.FirstOrDefaultAsync(u => u.Correo == correo);
            if (user == null)
                return NotFound("Usuario no encontrado.");

            if (user.EmailConfirmado)
                return Ok("El correo ya está confirmado.");

            var token = Guid.NewGuid().ToString("N");

            user.EmailConfirmacionToken = token;
            user.EmailConfirmacionExpira = DateTime.UtcNow.AddHours(24);

            await _context.SaveChangesAsync();

            var frontBaseUrl = _configuration["App:FrontendBaseUrl"] ?? "https://localhost:5173";
            var link = $"{frontBaseUrl}/confirm-email?correo={Uri.EscapeDataString(user.Correo)}&token={Uri.EscapeDataString(token)}";

            await _emailService.SendAsync(
                user.Correo,
                "Reenviar confirmación - ControlTec",
                $@"
                <p>Hola {user.Nombre},</p>
                <p>Confirma tu correo aquí:</p>
                <p><a href=""{link}"">Confirmar correo</a></p>
                <p>Vence en 24 horas.</p>"
            );

            return Ok("Se envió un nuevo correo de confirmación.");
        }

        // ============================
        // POST: api/Auth/login
        // Login paso 1: valida credenciales y manda 2FA
        // ============================
        [HttpPost("login")]
        [AllowAnonymous]
        public async Task<IActionResult> Login([FromBody] LoginRequest model)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var user = await _context.Usuarios
                .FirstOrDefaultAsync(u => u.Correo == model.Correo && u.Contraseña == model.Password);

            if (user == null)
                return Unauthorized("Correo o contraseña incorrectos.");

            if (!user.Activo)
                return Unauthorized("El usuario no está activo. Contacte al administrador.");

            if (!user.EmailConfirmado)
                return Unauthorized("Debes confirmar tu correo antes de iniciar sesión.");

            // ✅ Limpiar códigos viejos
            var viejos = await _context.TwoFactorCodes
                .Where(x => x.UsuarioId == user.Id && (x.Usado || x.ExpiraEn < DateTime.UtcNow))
                .ToListAsync();

            if (viejos.Count > 0)
            {
                _context.TwoFactorCodes.RemoveRange(viejos);
                await _context.SaveChangesAsync();
            }

            // ✅ Generar 2FA
            var codigo = GenerarCodigo6();
            var sessionToken = Guid.NewGuid().ToString("N");
            var expira = DateTime.UtcNow.AddMinutes(10);

            var registro2fa = new TwoFactorCode
            {
                UsuarioId = user.Id,
                CodigoHash = Sha256(codigo),
                SessionToken = sessionToken,
                ExpiraEn = expira,
                Usado = false,
                Intentos = 0
            };

            _context.TwoFactorCodes.Add(registro2fa);
            await _context.SaveChangesAsync();

            await _emailService.SendAsync(
                user.Correo,
                "Código de verificación (2FA) - ControlTec",
                $@"
                <p>Hola {user.Nombre},</p>
                <p>Tu código de verificación es: <b>{codigo}</b></p>
                <p>Expira en 10 minutos.</p>"
            );

            // ✅ NO devolvemos JWT aquí
            return Ok(new
            {
                requires2FA = true,
                sessionToken,
                expiresAtUtc = expira
            });
        }

        // ============================
        // POST: api/Auth/login/verify-2fa
        // Login paso 2: verifica código y devuelve JWT
        // ============================
        [HttpPost("login/verify-2fa")]
        [AllowAnonymous]
        public async Task<IActionResult> Verify2FA([FromBody] Verify2FADto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var registro = await _context.TwoFactorCodes
                .Include(x => x.Usuario)
                .FirstOrDefaultAsync(x => x.SessionToken == dto.SessionToken);

            if (registro == null)
                return Unauthorized("Sesión 2FA no válida.");

            if (registro.Usado)
                return Unauthorized("Este código ya fue usado. Inicia sesión nuevamente.");

            if (registro.ExpiraEn < DateTime.UtcNow)
                return Unauthorized("El código expiró. Inicia sesión nuevamente.");

            if (registro.Intentos >= 5)
                return Unauthorized("Demasiados intentos. Inicia sesión nuevamente.");

            var hash = Sha256(dto.Codigo);

            if (hash != registro.CodigoHash)
            {
                registro.Intentos += 1;
                await _context.SaveChangesAsync();
                return Unauthorized("Código incorrecto.");
            }

            // ✅ Correcto
            registro.Usado = true;
            await _context.SaveChangesAsync();

            var user = registro.Usuario!;
            if (!user.Activo)
                return Unauthorized("El usuario no está activo.");

            if (!user.EmailConfirmado)
                return Unauthorized("Debes confirmar tu correo antes de iniciar sesión.");

            var jwt = CrearJwt(user);

            return Ok(new
            {
                token = jwt,
                usuario = new
                {
                    user.Id,
                    user.Nombre,
                    user.Correo,
                    user.Roll,
                    user.Cedula,
                    user.Activo,
                    user.EsInternoPendiente,
                    user.EmailConfirmado
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
            return Ok(new
            {
                Id = User.FindFirstValue(ClaimTypes.NameIdentifier),
                Nombre = User.FindFirstValue(ClaimTypes.Name),
                Correo = User.FindFirstValue(ClaimTypes.Email),
                Roll = User.FindFirstValue(ClaimTypes.Role)
            });
        }
    }

    // ============================
    // DTO Login (simple)
    // ============================
    public class LoginRequest
    {
        public string Correo { get; set; } = null!;
        public string Password { get; set; } = null!;
    }
}