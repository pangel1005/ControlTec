using System.ComponentModel.DataAnnotations;

namespace ControlTec.Models.DTOs
{
    public class Verify2FADto
    {
        [Required]
        public string SessionToken { get; set; } = null!;

        [Required]
        [StringLength(6, MinimumLength = 6)]
        public string Codigo { get; set; } = null!;
    }
}
