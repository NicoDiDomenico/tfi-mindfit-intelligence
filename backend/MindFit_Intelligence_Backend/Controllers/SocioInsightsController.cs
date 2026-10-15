using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MindFit_Intelligence_Backend.DTOs.SocioInsights;
using MindFit_Intelligence_Backend.Services.Interfaces;

namespace MindFit_Intelligence_Backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class SocioInsightsController : ControllerBase
    {
        private readonly ISocioInsightsService _socioInsightsService;

        public SocioInsightsController(ISocioInsightsService socioInsightsService)
        {
            _socioInsightsService = socioInsightsService;
        }

        [Authorize(Policy = "SoloSocio")]
        [HttpGet("recomendaciones")]
        public async Task<ActionResult<IEnumerable<SocioRecomendacionDto>>> GetRecomendaciones()
        {
            var claimIdUsuario = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (!int.TryParse(claimIdUsuario, out var idUsuarioSocio))
            {
                return Unauthorized();
            }

            var recomendaciones = await _socioInsightsService.GetRecomendaciones(idUsuarioSocio);

            return Ok(recomendaciones);
        }
    }
}
