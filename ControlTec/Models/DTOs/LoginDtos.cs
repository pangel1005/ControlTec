namespace ControlTec.Models.DTOs
{
    public class LoginRequestDto
    {
        public string Correo { get; set; } = null!;
        public string Password { get; set; } = null!; // sin tilde para evitar líos en JSON
    }

    public class LoginResponseDto
    {
        public string Token { get; set; } = null!;
        public int UsuarioId { get; set; }
        public string Nombre { get; set; } = null!;
        public string Correo { get; set; } = null!;
        public string Roll { get; set; } = null!;
    }
}
