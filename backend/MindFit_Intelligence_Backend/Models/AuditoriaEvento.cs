using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MindFit_Intelligence_Backend.Models
{
    [Index(nameof(FechaHoraUtc))]
    [Index(nameof(Entidad), nameof(IdEntidad))]
    [Index(nameof(IdUsuario), nameof(FechaHoraUtc))]
    [Index(nameof(IdGimnasio), nameof(FechaHoraUtc))]
    public class AuditoriaEvento
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int IdAuditoriaEvento { get; set; }

        public DateTime FechaHoraUtc { get; set; }

        public int? IdUsuario { get; set; }

        [Column(TypeName = "varchar(80)")]
        public string? Username { get; set; }

        public int? IdGimnasio { get; set; }

        [Column(TypeName = "varchar(80)")]
        public string Entidad { get; set; } = string.Empty;

        public int? IdEntidad { get; set; }

        [Column(TypeName = "varchar(80)")]
        public string Accion { get; set; } = string.Empty;

        [Column(TypeName = "varchar(200)")]
        public string? Endpoint { get; set; }

        [Column(TypeName = "varchar(12)")]
        public string? MetodoHttp { get; set; }

        [Column(TypeName = "varchar(64)")]
        public string? IpAddress { get; set; }

        [Column(TypeName = "varchar(512)")]
        public string? UserAgent { get; set; }

        public string? ValoresOriginalesJson { get; set; }

        public string? ValoresNuevosJson { get; set; }

        public string? CambiosJson { get; set; }

        [Column(TypeName = "varchar(40)")]
        public string Resultado { get; set; } = "Exitoso";

        [Column(TypeName = "varchar(400)")]
        public string? Mensaje { get; set; }
    }
}
