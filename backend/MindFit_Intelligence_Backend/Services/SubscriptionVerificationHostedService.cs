using Microsoft.EntityFrameworkCore;
using MindFit_Intelligence_Backend.Models.Master;
using MindFit_Intelligence_Backend.Services.Interfaces;

namespace MindFit_Intelligence_Backend.Services
{
    public class SubscriptionVerificationHostedService : BackgroundService
    {
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly IConfiguration _configuration;
        private readonly ILogger<SubscriptionVerificationHostedService> _logger;

        public SubscriptionVerificationHostedService(
            IServiceScopeFactory scopeFactory,
            IConfiguration configuration,
            ILogger<SubscriptionVerificationHostedService> logger)
        {
            _scopeFactory = scopeFactory;
            _configuration = configuration;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            if (!_configuration.GetValue("SubscriptionVerification:Enabled", true))
                return;

            var intervalMinutes = Math.Max(
                5,
                _configuration.GetValue("SubscriptionVerification:IntervalMinutes", 360));

            using var timer = new PeriodicTimer(TimeSpan.FromMinutes(intervalMinutes));

            await VerifySubscriptionsAsync(stoppingToken);

            while (await timer.WaitForNextTickAsync(stoppingToken))
            {
                await VerifySubscriptionsAsync(stoppingToken);
            }
        }

        private async Task VerifySubscriptionsAsync(CancellationToken stoppingToken)
        {
            try
            {
                using var scope = _scopeFactory.CreateScope();
                var masterContext = scope.ServiceProvider.GetRequiredService<MindFitMasterContext>();
                var payPalService = scope.ServiceProvider.GetRequiredService<IPayPalService>();

                var gyms = await masterContext.Gyms
                    .Where(g => g.Activo && g.PayPalSubscriptionId != null)
                    .ToListAsync(stoppingToken);

                foreach (var gym in gyms)
                {
                    await VerifyGymAsync(gym, payPalService, masterContext, stoppingToken);
                }
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                // Normal shutdown.
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "No se pudo completar la verificacion periodica de suscripciones PayPal.");
            }
        }

        private async Task VerifyGymAsync(
            Gym gym,
            IPayPalService payPalService,
            MindFitMasterContext masterContext,
            CancellationToken stoppingToken)
        {
            try
            {
                var subscription = await payPalService.GetSubscriptionStatusAsync(
                    gym.PayPalSubscriptionId!,
                    stoppingToken);

                if (subscription.Status.Equals("CANCELLED", StringComparison.OrdinalIgnoreCase)
                    && !gym.FechaAccesoHastaUtc.HasValue
                    && gym.FechaProximoPagoUtc.HasValue)
                {
                    gym.FechaAccesoHastaUtc = gym.FechaProximoPagoUtc;
                }

                gym.PayPalPlanId = subscription.PlanId ?? gym.PayPalPlanId;
                gym.EstadoSuscripcionPayPal = subscription.Status;
                gym.FechaProximoPagoUtc = subscription.NextBillingTimeUtc;
                gym.FechaEstadoSuscripcionUtc = subscription.StatusUpdateTimeUtc;
                gym.FechaUltimaVerificacionPayPalUtc = subscription.LastVerificationPayPalUtc;

                var now = DateTime.UtcNow;
                var shouldBlock = GymPublicoService.DebeBloquearAcceso(gym, now);
                gym.AccesoBloqueadoPorSuscripcion = shouldBlock;
                gym.FechaBloqueoSuscripcionUtc = shouldBlock
                    ? gym.FechaBloqueoSuscripcionUtc ?? now
                    : null;

                var hasHistory = await masterContext.GymPayPalSubscriptionHistorial
                    .AnyAsync(h => h.IdGym == gym.IdGym, stoppingToken);

                if (!hasHistory)
                {
                    masterContext.GymPayPalSubscriptionHistorial.Add(new GymPayPalSubscriptionHistorial
                    {
                        IdGym = gym.IdGym,
                        PayPalSubscriptionId = gym.PayPalSubscriptionId!,
                        PayPalPlanId = gym.PayPalPlanId,
                        EstadoPayPal = gym.EstadoSuscripcionPayPal,
                        FechaInicioUtc = gym.FechaCreacion,
                        FechaFinAccesoUtc = gym.FechaAccesoHastaUtc,
                        Motivo = "AltaInicialDetectada",
                        FechaRegistroUtc = now
                    });
                }

                await masterContext.SaveChangesAsync(stoppingToken);
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                _logger.LogWarning(
                    ex,
                    "No se pudo verificar la suscripcion PayPal {SubscriptionId} del gimnasio {IdGym}.",
                    gym.PayPalSubscriptionId,
                    gym.IdGym);
            }
        }
    }
}
