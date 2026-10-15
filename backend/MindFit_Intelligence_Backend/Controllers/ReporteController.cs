using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MindFit_Intelligence_Backend.DTOs.Reportes;
using MindFit_Intelligence_Backend.Services.Interfaces;

namespace MindFit_Intelligence_Backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Policy = "VerReportesGimnasio")]
    public class ReporteController : ControllerBase
    {
        private readonly IReporteService _reporteService;

        public ReporteController(IReporteService reporteService)
        {
            _reporteService = reporteService;
        }

        [HttpGet("gimnasio")]
        public async Task<ActionResult<ReportesGimnasioDto>> GetReportesGimnasio(
            [FromQuery] ReporteFiltroDto filtro)
        {
            return Ok(await _reporteService.GetReportesGimnasio(filtro));
        }
    }
}
