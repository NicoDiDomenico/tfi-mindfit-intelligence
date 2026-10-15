using Microsoft.EntityFrameworkCore;
using MindFit_Intelligence_Backend.Models.Master;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MindFit_Intelligence_Backend.Models.Master
{
    [Index(nameof(Username), IsUnique = true)]
    public class UsuarioMaster
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int IdUsuarioMaster { get; set; } // PK

        public int IdGym { get; set; }
        public Gym? Gym { get; set; }

        public PersonaResponsableMaster? PersonaResponsableMaster { get; set; } // Navegación a PersonaResponsable


        [Column(TypeName = "date")]
        public DateTime FechaRegistro { get; set; } = DateTime.Now;

        #region JWT

        [Column(TypeName = "varchar(50)")]
        public string Username { get; set; } = string.Empty;

        [Column(TypeName = "varchar(255)")]
        public string PasswordHash { get; set; } = string.Empty;

        [Column(TypeName = "varchar(512)")]
        public string? RefreshToken { get; set; }

        [Column(TypeName = "datetime2")]
        public DateTime? RefreshTokenExpiryTime { get; set; }
        #endregion

        #region Password Reset
        [Column(TypeName = "varchar(64)")]
        public string? PasswordResetTokenHash { get; set; }

        [Column(TypeName = "datetime2")]
        public DateTime? PasswordResetTokenExpiryTime { get; set; }
        #endregion
    }
}
