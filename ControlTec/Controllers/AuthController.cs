using System;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
using ControlTec.Data;
using ControlTec.Models;
using ControlTec.Models.DTOs;
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

        public AuthController(AppDbContext context, IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
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

            // Buscar usuario por correo y contraseña
            var user = await _context.Usuarios
                .FirstOrDefaultAsync(u =>
                    u.Correo == model.Correo &&
                    u.Contraseña == model.Password);

            if (user == null)
                return Unauthorized("Correo o contraseña incorrectos.");

            if (!user.Activo)
                return Unauthorized("El usuario no está activo. Contacte al administrador.");

            // ==============
            // 1. Claims
            // ==============
            var claims = new[]
            {
                new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Name, user.Nombre),
                new Claim(ClaimTypes.Email, user.Correo),
                new Claim(ClaimTypes.Role, user.Roll ?? string.Empty)
            };

            // ==============
            // 2. Clave JWT
            // ==============
            var key = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(_configuration["Jwt:SecretKey"]!)
            );

            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            // ==============
            // 3. Token
            // ==============
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

        // ============================
        // POST: api/Auth/register
        // Registro de nuevos usuarios
        // ============================
        [HttpPost("register")]
        [AllowAnonymous]
        public async Task<IActionResult> Register([FromBody] RegistroUsuarioDto model)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            // Validar correo único
            var existeCorreo = await _context.Usuarios
                .AnyAsync(u => u.Correo == model.Correo);

            if (existeCorreo)
                return BadRequest("Ya existe un usuario registrado con ese correo.");

            // Validar cédula (simple: 11 dígitos)
            if (string.IsNullOrWhiteSpace(model.Cedula) ||
                model.Cedula.Length != 11 ||
                !long.TryParse(model.Cedula, out _))
            {
                return BadRequest("La cédula debe tener exactamente 11 dígitos numéricos.");
            }

            // Normalizar tipo de usuario
            var tipo = (model.TipoUsuario ?? "Solicitante").Trim().ToLower();

            string rolInicial;
            bool activo;
            bool esInternoPendiente;

            if (tipo == "interno")
            {
                // Usuarios internos: NO activos de una vez
                rolInicial = "Pendiente";
                activo = false;
                esInternoPendiente = true;
            }
            else
            {
                // Por defecto: solicitante normal
                rolInicial = "Solicitante";
                activo = true;
                esInternoPendiente = false;
            }

            var nuevoUsuario = new Usuario
            {
                Nombre = model.Nombre,
                Correo = model.Correo,
                Contraseña = model.Password,     // en la vida real -> hash
                Roll = rolInicial,
                Activo = activo,
                EsInternoPendiente = esInternoPendiente,
                Cedula = model.Cedula
            };

            _context.Usuarios.Add(nuevoUsuario);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                mensaje = "Usuario registrado correctamente.",
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
        // Solo Admin: aprobar usuario interno
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

            // Asignar rol final y activar usuario
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
        // (para probar el token)
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
    }

    // ============================
    // DTOs usados por el AuthController
    // ============================

    public class LoginRequest
    {
        public string Correo { get; set; } = null!;
        public string Password { get; set; } = null!;
    }
}
