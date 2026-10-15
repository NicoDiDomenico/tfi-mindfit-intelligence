using System.ComponentModel.DataAnnotations;

namespace MindFit_Intelligence_Backend.Models.Master
{
    public class Gym
    {
        [Key]
        public int IdGym { get; set; }

        [Required]
        [MaxLength(150)]
        public string NombreGym { get; set; } = string.Empty;

        [Required]
        [MaxLength(500)]
        public string ConnectionString { get; set; } = string.Empty;

        public bool Activo { get; set; } = true;

        public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;

        public string? PayPalSubscriptionId { get; set; }

        public string? EstadoSuscripcionPayPal { get; set; }

        public DateTime? FechaProximoPagoUtc { get; set; }

        public DateTime? FechaEstadoSuscripcionUtc { get; set; }

        public DateTime? FechaUltimaVerificacionPayPalUtc { get; set; }

        public DateTime? FechaAccesoHastaUtc { get; set; }

        public bool AccesoBloqueadoPorSuscripcion { get; set; }

        public DateTime? FechaBloqueoSuscripcionUtc { get; set; }

        public string? PayPalPlanId { get; set; }
    }
}
