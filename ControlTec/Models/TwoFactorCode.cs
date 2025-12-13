using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ControlTec.Models
{
    [Table("TwoFactorCodes")]
    public class TwoFactorCode
    {
        public int Id { get; set; }

        [Required]
        public int UsuarioId { get; set; }
        public Usuario? Usuario { get; set; }

        [Required]
        [MaxLength(64)]
        public string CodigoHash { get; set; } = null!; // SHA256 del código

        [Required]
        public DateTime ExpiraEn { get; set; }

        [Required]
        public bool Usado { get; set; } = false;

        [Required]
        public int Intentos { get; set; } = 0;

        [Required]
        [MaxLength(64)]
        public string SessionToken { get; set; } = null!; // GUID string
    }
}