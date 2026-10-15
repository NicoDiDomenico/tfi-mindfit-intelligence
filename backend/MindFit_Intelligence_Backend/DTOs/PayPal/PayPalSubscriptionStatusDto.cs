namespace MindFit_Intelligence_Backend.DTOs.PayPal
{
    public class PayPalSubscriptionStatusDto
    {
        public string SubscriptionId { get; set; } = null!;
        public string? PlanId { get; set; }
        public string Status { get; set; } = null!;
        public bool IsApproved { get; set; }
        public bool IsActive { get; set; }
        public DateTime? NextBillingTimeUtc { get; set; }
        public DateTime? StatusUpdateTimeUtc { get; set; }
        public DateTime LastVerificationPayPalUtc { get; set; }
    }
}
