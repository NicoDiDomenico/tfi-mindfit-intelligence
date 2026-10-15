using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MindFit_Intelligence_Backend.DTOs.Personas;
using MindFit_Intelligence_Backend.Services.Interfaces;

namespace MindFit_Intelligence_Backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PersonaResponsableController : ControllerBase
    {
        private readonly IPersonaResponsableService _PersonaResponsableService;

        public PersonaResponsableController(IPersonaResponsableService PersonaResponsableService)
        {
            _PersonaResponsableService = PersonaResponsableService;
        }

        // Front: Por si se quiere mostrar una lista de SOLO responsables, pero probablemente no se haga o se muestre con UsuariosController
        [HttpGet]
        [Authorize]
        public async Task<IEnumerable<PersonaResponsableDto>> Get()
        {
            IEnumerable<PersonaResponsableDto> PersonaResponsable = await _PersonaResponsableService.Get();

            return PersonaResponsable;
        }

        // Front : Para mostrar el detalle de un responsable, pero probablemente no se haga o se muestre con UsuariosController
        [HttpGet("{id}")]
        [Authorize]
        public async Task<ActionResult<PersonaResponsableDto>> GetById(int id)
        {
            PersonaResponsableDto? PersonaResponsableDto = await _PersonaResponsableService.GetById(id);

            return PersonaResponsableDto == null
                ? NotFound() // 404 Not Found
                : Ok(PersonaResponsableDto); // 200 OK
        }

        /* Front: Lista de entrenadores para asignarlos a un DiaRangoHorario.
           Se usa en DiaRangoHorarioController.cs*/
        [Authorize]
        [HttpGet("entrenadores")]
        public async Task<ActionResult<IEnumerable<EntrenadorDto>>> GetEntrenadores()
        {
            var entrenadores = await _PersonaResponsableService.GetEntrenadores();
            return Ok(entrenadores);
        }

    }
}
