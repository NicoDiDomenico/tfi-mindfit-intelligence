namespace MindFit_Intelligence_Backend.DTOs.PayPal
{
    public class PayPalPlanDto
    {
        public string ProductId { get; set; } = null!;
        public string PlanId { get; set; } = null!;
        public bool Created { get; set; }
    }
}
