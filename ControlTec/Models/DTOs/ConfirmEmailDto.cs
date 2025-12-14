namespace ControlTec.Models.DTOs
{
    public class ConfirmEmailDto
    {
        public string Email { get; set; } = null!;
        public string Token { get; set; } = null!;
    }
}
