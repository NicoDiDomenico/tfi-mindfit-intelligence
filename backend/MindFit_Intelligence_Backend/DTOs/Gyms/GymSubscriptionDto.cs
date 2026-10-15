namespace MindFit_Intelligence_Backend.DTOs.Gyms
{
    public class GymSubscriptionDto
    {
        public int IdGym { get; set; }
        public string? PayPalSubscriptionId { get; set; }
        public string? EstadoSuscripcionPayPal { get; set; }
        public string EstadoSuscripcionTexto { get; set; } = "No disponible";
        public string MensajeCliente { get; set; } = string.Empty;
        public decimal ImporteMensual { get; set; }
        public string Moneda { get; set; } = "USD";
        public DateTime? FechaProximoPagoUtc { get; set; }
        public DateTime? FechaAccesoHastaUtc { get; set; }
        public DateTime? FechaEstadoSuscripcionUtc { get; set; }
        public DateTime? FechaUltimaVerificacionPayPalUtc { get; set; }
        public bool AccesoBloqueadoPorSuscripcion { get; set; }
        public bool PuedeCancelar { get; set; }
        public bool PuedeReactivar { get; set; }
        public bool PuedeVolverASuscribirse { get; set; }
        public string? MotivoAccionDeshabilitada { get; set; }
    }
}
