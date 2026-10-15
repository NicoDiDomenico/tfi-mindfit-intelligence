using MindFit_Intelligence_Backend.DTOs.PayPal;

namespace MindFit_Intelligence_Backend.Services.Interfaces
{
    public interface IPayPalService
    {
        Task<PayPalConfigDto> GetConfigAsync(bool allowPlanCreation);
        Task<PayPalConfigDto> GetResubscriptionConfigAsync(bool allowPlanCreation);
        Task<PayPalPlanDto> EnsurePlanAsync();
        Task<PayPalPlanDto> EnsureResubscriptionPlanAsync();
        Task<PayPalSubscriptionStatusDto> GetSubscriptionStatusAsync(
            string subscriptionId,
            CancellationToken cancellationToken = default);

        Task<PayPalSubscriptionStatusDto> WaitForActiveSubscriptionAsync(
            string subscriptionId,
            CancellationToken cancellationToken = default);

        Task<PayPalSubscriptionStatusDto> CancelSubscriptionAsync(
            string subscriptionId,
            string reason,
            CancellationToken cancellationToken = default);

        Task<PayPalSubscriptionStatusDto> ActivateSubscriptionAsync(
            string subscriptionId,
            string reason,
            CancellationToken cancellationToken = default);
    }
}
