using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MindFit_Intelligence_Backend.Models
{
    [Index(nameof(Username), IsUnique = true)]
    public class Usuario
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int IdUsuario { get; set; } // PK

        public PersonaResponsable? PersonaResponsable { get; set; } // Navegación a PersonaResponsable

        public PersonaSocio? PersonaSocio { get; set; } // Navegación a PersonaSocio

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
        public required ICollection<UsuarioGrupo> UsuarioGrupos { get; set; }
    }
}
