using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MindFit_Intelligence_Backend.DTOs.Auditoria;
using MindFit_Intelligence_Backend.Services.Interfaces;

namespace MindFit_Intelligence_Backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Policy = "VerAuditoria")]
    public class AuditoriaController : ControllerBase
    {
        private readonly IAuditoriaService _auditoriaService;

        public AuditoriaController(IAuditoriaService auditoriaService)
        {
            _auditoriaService = auditoriaService;
        }

        [HttpGet("eventos")]
        public async Task<ActionResult<AuditoriaResultadoDto<AuditoriaEventoDto>>> GetEventos(
            [FromQuery] AuditoriaEventoFiltroDto filtro)
        {
            return Ok(await _auditoriaService.GetEventos(filtro));
        }

        [HttpGet("rutinas/{idRutina:int}")]
        public async Task<ActionResult<AuditoriaResultadoDto<AuditoriaEventoDto>>> GetEventosRutina(
            int idRutina,
            [FromQuery] AuditoriaEventoFiltroDto filtro)
        {
            filtro.Entidad = "Rutina";
            filtro.IdEntidad = idRutina;
            return Ok(await _auditoriaService.GetEventos(filtro));
        }

        [HttpGet("eventos/{idAuditoriaEvento:int}")]
        public async Task<ActionResult<AuditoriaEventoDto>> GetEventoDetalle(int idAuditoriaEvento)
        {
            var evento = await _auditoriaService.GetEventoById(idAuditoriaEvento);
            return evento == null
                ? NotFound("No existe el evento de auditoria solicitado")
                : Ok(evento);
        }

        [HttpGet("sesiones")]
        public async Task<ActionResult<AuditoriaResultadoDto<AuditoriaSesionDto>>> GetSesiones(
            [FromQuery] AuditoriaSesionFiltroDto filtro)
        {
            return Ok(await _auditoriaService.GetSesiones(filtro));
        }

        [HttpGet("resumen")]
        public async Task<ActionResult<AuditoriaReporteResumenDto>> GetResumen(
            [FromQuery] DateTime? fechaDesde,
            [FromQuery] DateTime? fechaHasta)
        {
            return Ok(await _auditoriaService.GetResumen(fechaDesde, fechaHasta));
        }
    }
}
