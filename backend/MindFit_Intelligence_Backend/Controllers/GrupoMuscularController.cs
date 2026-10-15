using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MindFit_Intelligence_Backend.DTOs.GrupoMuscular;
using MindFit_Intelligence_Backend.Services.Interfaces;

namespace MindFit_Intelligence_Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class GrupoMuscularController : ControllerBase
    {
        private readonly IGrupoMuscularService _grupoMuscularService;

        public GrupoMuscularController(IGrupoMuscularService grupoMuscularService)
        {
            _grupoMuscularService = grupoMuscularService;
        }

        // CUD12 – Agregar Rutina y CUD13 – Modificar Rutina
        // Front: Ejercicio necesita IdGrupoMuscular, por eso se obtiene la lista completa de grupos musculares para mostrar en un Mapa Anatomico o un dropdown.
        // Testeado --> Anda bien
        [Authorize]
        [HttpGet]
        public async Task<ActionResult<IEnumerable<GrupoMuscularDto>>> Get()
        {
            var gruposMusculares = await _grupoMuscularService.GetAsync();
            return Ok(gruposMusculares);
        }

        // Front: No creo que lo use. Si se necesita, se puede agregar un endpoint para obtener un grupo muscular por su Id.
        // Testeado --> Anda bien
        [HttpGet("{id}")]
        public async Task<ActionResult<GrupoMuscularDto>> GetById(int id)
        {
            var grupoMuscular = await _grupoMuscularService.GetByIdAsync(id);

            if (grupoMuscular == null)
            {
                return NotFound(new { Errors = _grupoMuscularService.Errors });
            }

            return Ok(grupoMuscular);
        }
    }
}
