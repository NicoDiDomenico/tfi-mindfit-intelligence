namespace MindFit_Intelligence_Backend.DTOs.PayPal
{
    public class PayPalConfigDto
    {
        public string ClientId { get; set; } = null!;
        public string PlanId { get; set; } = null!;
        public string Currency { get; set; } = "USD";
    }
}
