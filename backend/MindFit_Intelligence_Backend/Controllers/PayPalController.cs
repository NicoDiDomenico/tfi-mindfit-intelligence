using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MindFit_Intelligence_Backend.DTOs.PayPal;
using MindFit_Intelligence_Backend.Repository.Interfaces;
using MindFit_Intelligence_Backend.Services.Interfaces;

namespace MindFit_Intelligence_Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PayPalController : ControllerBase
    {
        private readonly IPayPalService _payPalService;
        private readonly IGymRepository _gymRepository;
        private readonly IWebHostEnvironment _environment;
        private readonly ILogger<PayPalController> _logger;

        public PayPalController(
            IPayPalService payPalService,
            IGymRepository gymRepository,
            IWebHostEnvironment environment,
            ILogger<PayPalController> logger)
        {
            _payPalService = payPalService;
            _gymRepository = gymRepository;
            _environment = environment;
            _logger = logger;
        }

        [AllowAnonymous]
        [HttpGet("config")]
        public async Task<ActionResult<PayPalConfigDto>> GetConfig()
        {
            try
            {
                return Ok(await _payPalService.GetConfigAsync(_environment.IsDevelopment()));
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogWarning(ex, "Configuracion PayPal incompleta.");
                return StatusCode(StatusCodes.Status503ServiceUnavailable, ex.Message);
            }
        }

        [AllowAnonymous]
        [HttpPost("dev/ensure-plan")]
        public async Task<ActionResult<PayPalPlanDto>> EnsurePlan()
        {
            if (!_environment.IsDevelopment())
                return NotFound();

            try
            {
                return Ok(await _payPalService.EnsurePlanAsync());
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogWarning(ex, "No se pudo crear el plan PayPal sandbox.");
                return StatusCode(StatusCodes.Status503ServiceUnavailable, ex.Message);
            }
        }

        [AllowAnonymous]
        [HttpPost("dev/ensure-resubscription-plan")]
        public async Task<ActionResult<PayPalPlanDto>> EnsureResubscriptionPlan()
        {
            if (!_environment.IsDevelopment())
                return NotFound();

            try
            {
                return Ok(await _payPalService.EnsureResubscriptionPlanAsync());
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogWarning(ex, "No se pudo crear el plan PayPal sandbox de resuscripcion.");
                return StatusCode(StatusCodes.Status503ServiceUnavailable, ex.Message);
            }
        }

        [AllowAnonymous]
        [HttpGet("subscriptions/{subscriptionId}")]
        public async Task<ActionResult<PayPalSubscriptionStatusDto>> GetSubscription(string subscriptionId)
        {
            try
            {
                var subscription = await _payPalService.GetSubscriptionStatusAsync(
                    subscriptionId,
                    HttpContext.RequestAborted);

                await _gymRepository.ActualizarSuscripcionPayPalAsync(
                    subscription.SubscriptionId,
                    subscription.Status,
                    subscription.PlanId,
                    subscription.NextBillingTimeUtc,
                    subscription.StatusUpdateTimeUtc,
                    subscription.LastVerificationPayPalUtc);

                return Ok(subscription);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogWarning(ex, "No se pudo validar la suscripcion PayPal {SubscriptionId}.", subscriptionId);
                return StatusCode(StatusCodes.Status503ServiceUnavailable, ex.Message);
            }
        }
    }
}
