using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MindFit_Intelligence_Backend.DTOs.Gyms;
using MindFit_Intelligence_Backend.Services;
using MindFit_Intelligence_Backend.Services.Interfaces;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace MindFit_Intelligence_Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class GymsController : ControllerBase
    {
        private readonly IGymPublicoService _gymPublicoService;
        private readonly IPayPalService _payPalService;
        private readonly ITenantContext _tenantContext;
        private readonly IWebHostEnvironment _environment;

        public GymsController(
            IGymPublicoService gymPublicoService,
            IPayPalService payPalService,
            ITenantContext tenantContext,
            IWebHostEnvironment environment)
        {
            _gymPublicoService = gymPublicoService;
            _payPalService = payPalService;
            _tenantContext = tenantContext;
            _environment = environment;
        }

        // Front: Para dropdown de NombreGym para que se asigne el IdGym al header del endpoint POST api/Auth/login.
        [HttpGet("activos")]
        [AllowAnonymous]
        public async Task<ActionResult<IEnumerable<GymPublicoDTO>>> GetAllActivos()
        {
            var gyms = await _gymPublicoService.GetAllGymsActivosAsync();
            return Ok(gyms);
        }

        [AllowAnonymous]
        [HttpPost("onboarding")]
        public async Task<IActionResult> RegistrarNuevoGym([FromBody] NuevoGymRequestDto dto)
        {
            try
            {
                var subscription = await _payPalService.WaitForActiveSubscriptionAsync(
                    dto.PayPalSubscriptionId,
                    HttpContext.RequestAborted);

                if (!subscription.IsActive)
                    return BadRequest($"La suscripcion PayPal debe estar ACTIVE para registrar el gimnasio. Estado actual: {subscription.Status}.");

                var idGym = await _gymPublicoService.RegistrarNuevoGymAsync(dto, subscription);

                return Ok(new
                {
                    mensaje = "Gimnasio registrado con éxito.",
                    idGym = idGym
                });
            }
            catch (GymOnboardingConflictException ex)
            {
                return Conflict(ex.Message);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (InvalidOperationException ex)
            {
                return StatusCode(StatusCodes.Status503ServiceUnavailable, ex.Message);
            }
        }

        [Authorize(Policy = "VerMiSuscripcion")]
        [HttpGet("mi-suscripcion")]
        public async Task<ActionResult<GymSubscriptionDto>> GetMiSuscripcion()
        {
            if (!_tenantContext.IdGimnasio.HasValue)
                return BadRequest("No se pudo resolver el gimnasio actual.");

            try
            {
                return Ok(await _gymPublicoService.GetMiSuscripcionAsync(_tenantContext.IdGimnasio.Value));
            }
            catch (InvalidOperationException ex)
            {
                return NotFound(ex.Message);
            }
        }

        [Authorize(Policy = "VerMiSuscripcion")]
        [HttpPost("mi-suscripcion/actualizar")]
        public async Task<ActionResult<GymSubscriptionDto>> ActualizarMiSuscripcion()
        {
            if (!_tenantContext.IdGimnasio.HasValue)
                return BadRequest("No se pudo resolver el gimnasio actual.");

            try
            {
                return Ok(await _gymPublicoService.ActualizarMiSuscripcionAsync(
                    _tenantContext.IdGimnasio.Value,
                    HttpContext.RequestAborted));
            }
            catch (InvalidOperationException ex)
            {
                return NotFound(ex.Message);
            }
        }

        [Authorize(Policy = "VerMiSuscripcion")]
        [HttpPost("mi-suscripcion/cancelar")]
        public async Task<ActionResult<GymSubscriptionDto>> CancelarMiSuscripcion()
        {
            if (!_tenantContext.IdGimnasio.HasValue)
                return BadRequest("No se pudo resolver el gimnasio actual.");

            try
            {
                return Ok(await _gymPublicoService.CancelarMiSuscripcionAsync(
                    _tenantContext.IdGimnasio.Value,
                    HttpContext.RequestAborted));
            }
            catch (InvalidOperationException ex)
            {
                return Conflict(ex.Message);
            }
        }

        [Authorize(Policy = "VerMiSuscripcion")]
        [HttpPost("mi-suscripcion/reactivar")]
        public async Task<ActionResult<GymSubscriptionDto>> ReactivarMiSuscripcion()
        {
            if (!_tenantContext.IdGimnasio.HasValue)
                return BadRequest("No se pudo resolver el gimnasio actual.");

            try
            {
                return Ok(await _gymPublicoService.ReactivarMiSuscripcionAsync(
                    _tenantContext.IdGimnasio.Value,
                    HttpContext.RequestAborted));
            }
            catch (InvalidOperationException ex)
            {
                return Conflict(ex.Message);
            }
        }

        [Authorize(Policy = "VerMiSuscripcion")]
        [HttpGet("mi-suscripcion/resuscripcion/config")]
        public async Task<ActionResult> GetResuscripcionConfig()
        {
            try
            {
                return Ok(await _payPalService.GetResubscriptionConfigAsync(_environment.IsDevelopment()));
            }
            catch (InvalidOperationException ex)
            {
                return StatusCode(StatusCodes.Status503ServiceUnavailable, ex.Message);
            }
        }

        [Authorize(Policy = "VerMiSuscripcion")]
        [HttpPost("mi-suscripcion/resuscripcion/confirmar")]
        public async Task<ActionResult<GymSubscriptionDto>> ConfirmarResuscripcion(
            [FromBody] ConfirmarResuscripcionRequestDto dto)
        {
            if (!_tenantContext.IdGimnasio.HasValue)
                return BadRequest("No se pudo resolver el gimnasio actual.");

            try
            {
                return Ok(await _gymPublicoService.ConfirmarResuscripcionAsync(
                    _tenantContext.IdGimnasio.Value,
                    dto.PayPalSubscriptionId,
                    HttpContext.RequestAborted));
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (InvalidOperationException ex)
            {
                return Conflict(ex.Message);
            }
        }
    }
}
