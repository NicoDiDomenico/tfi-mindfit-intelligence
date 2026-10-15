using System.ComponentModel.DataAnnotations;

namespace MindFit_Intelligence_Backend.Models.Master
{
    public class GymPayPalSubscriptionHistorial
    {
        [Key]
        public int IdHistorial { get; set; }

        public int IdGym { get; set; }

        public Gym Gym { get; set; } = null!;

        public string PayPalSubscriptionId { get; set; } = string.Empty;

        public string? PayPalPlanId { get; set; }

        public string? EstadoPayPal { get; set; }

        public DateTime? FechaInicioUtc { get; set; }

        public DateTime? FechaFinAccesoUtc { get; set; }

        public DateTime? FechaReemplazoUtc { get; set; }

        public string Motivo { get; set; } = string.Empty;

        public DateTime FechaRegistroUtc { get; set; } = DateTime.UtcNow;
    }
}
