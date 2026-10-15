using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MindFit_Intelligence_Backend.DTOs.RangoHorario;
using MindFit_Intelligence_Backend.Services.Interfaces;

namespace MindFit_Intelligence_Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class RangoHorarioController : ControllerBase
    {
        private readonly IRangoHorarioService _rangoHorarioService;

        public RangoHorarioController(IRangoHorarioService rangoHorarioService)
        {
            _rangoHorarioService = rangoHorarioService;
        }

        // CUD10 – Gestionar Rutina
        // Chequeado --> Anda bien
        // Front: Se usa para obtener la lista de rangos horarios y seleccionar el IdRangoHorario.
        [Authorize]
        [HttpGet]
        public async Task<ActionResult<IEnumerable<RangoHorarioDto>>> Get()
        {
            var rangosHorarios = await _rangoHorarioService.GetAsync();
            return Ok(rangosHorarios);
        }
    }
}
