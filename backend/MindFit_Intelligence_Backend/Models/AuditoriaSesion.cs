using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MindFit_Intelligence_Backend.Models
{
    [Index(nameof(FechaHoraUtc))]
    [Index(nameof(IdUsuario), nameof(FechaHoraUtc))]
    [Index(nameof(IdGimnasio), nameof(FechaHoraUtc))]
    public class AuditoriaSesion
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int IdAuditoriaSesion { get; set; }

        public DateTime FechaHoraUtc { get; set; }

        public int? IdUsuario { get; set; }

        [Column(TypeName = "varchar(80)")]
        public string? UsernameIntentado { get; set; }

        public int? IdGimnasio { get; set; }

        [Column(TypeName = "varchar(40)")]
        public string TipoEvento { get; set; } = string.Empty;

        [Column(TypeName = "varchar(40)")]
        public string Resultado { get; set; } = string.Empty;

        [Column(TypeName = "varchar(64)")]
        public string? IpAddress { get; set; }

        [Column(TypeName = "varchar(512)")]
        public string? UserAgent { get; set; }

        [Column(TypeName = "varchar(200)")]
        public string? MotivoFallo { get; set; }
    }
}
