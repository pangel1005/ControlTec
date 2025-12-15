using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

public class Usuario
{
    public string? EmailConfirmacionToken { get; set; }
    public DateTime? EmailConfirmacionExpira { get; set; }
    public bool EmailConfirmado { get; set; } = false;
    public DateTime? FechaEmailConfirmado { get; set; }
    public int Id { get; set; }

    [Required]
    public string Nombre { get; set; } = null!;

    [Required]
    [EmailAddress]
    public string Correo { get; set; } = null!;

    [Required]
    [JsonIgnore]
    public string Contraseña { get; set; } = null!;

    [Required]
    public string Roll { get; set; } = null!;

    public bool Activo { get; set; } = true;

    public bool EsInternoPendiente { get; set; } = false;

    // Para login con código
    public string? CodigoVerificacion { get; set; }
    public DateTime? CodigoVerificacionExpira { get; set; }

    // 🔹 Nueva propiedad
    [Required]
    [StringLength(11, MinimumLength = 11)]
    public string Cedula { get; set; } = null!;
}
