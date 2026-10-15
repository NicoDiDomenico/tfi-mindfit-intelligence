using FluentValidation;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MindFit_Intelligence_Backend.DTOs.Grupos;
using MindFit_Intelligence_Backend.Services.Interfaces;

namespace MindFit_Intelligence_Backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class GrupoController : ControllerBase
    {
        private readonly IGrupoService _grupoService;
        private readonly IValidator<GrupoInsertDto> _insertValidator;
        private readonly IValidator<GrupoUpdateDto> _updateValidator;

        public GrupoController(
            IGrupoService grupoService,
            IValidator<GrupoInsertDto> insertValidator,
            IValidator<GrupoUpdateDto> updateValidator)
        {
            _grupoService = grupoService;
            _insertValidator = insertValidator;
            _updateValidator = updateValidator;
        }

        // Front: Mostrar los grupos para Responsables (No Grupo SOCIO) en una grilla para seleccionar uno y hacer modificacion o eliminación
        [HttpGet]
        [Authorize]
        public async Task<ActionResult<IEnumerable<GrupoDto>>> Get()
        {
            var gruposDtos = await _grupoService.Get();

            return !gruposDtos.Any() ? NotFound("No hay grupos cargados") : Ok(gruposDtos);
        }

        /* No creo que lo necesite
        // Front: Traer grupos para autenticación con el detalle mínimo de permisos
        [HttpGet("auth")]
        //[Authorize]
        public async Task<ActionResult<IEnumerable<GrupoAuthDto>>> GetAuth()
        {
            var gruposAuthDtos = await _grupoService.GetAuth();

            return !gruposAuthDtos.Any() ? NotFound("No hay grupos cargados") : Ok(gruposAuthDtos);
        }
        */

        /* No sirve
        // Front: Traer absolutamente todos los grupos (incluyendo Socio), sin permisos, para asociarlos a botones y compararlos contra claims
        [HttpGet("todos")]
        [AllowAnonymous]
        public async Task<ActionResult<IEnumerable<GrupoDto>>> GetAllSinPermisos()
        {
            var gruposDtos = await _grupoService.GetAllSinPermisos();

            return !gruposDtos.Any() ? NotFound("No hay grupos cargados") : Ok(gruposDtos);
        }
        */

        // Front: ?
        [HttpGet("{id}")]
        [Authorize]
        public async Task<ActionResult<GrupoDto>> GetById(int id)
        {
            var result = await _grupoService.GetById(id);
            return (result == null) ? NotFound() : Ok(result);
        }


        // Front: Formulario para crear un nuevo grupo, con un select multiple para elegir los permisos que va a tener el grupo
        // Chequeado --> Anda bien
        [HttpPost]
        [Authorize(Policy = "CrearGrupo")]
        public async Task<ActionResult<GrupoDto>> Add(GrupoInsertDto grupoInsertDto)
        {
            // FluentValidation
            var validationResult = await _insertValidator.ValidateAsync(grupoInsertDto);
            if (!validationResult.IsValid)
                return BadRequest(validationResult.Errors.Select(e => e.ErrorMessage));

            var result = await _grupoService.Add(grupoInsertDto);


            return (result == null)
                ? NotFound()
                : CreatedAtAction(
                    nameof(GetById),
                    new { id = result.IdGrupo },
                    result);
        }

        // Front: Formulario para modificar un grupo existente, con un select multiple para elegir los permisos que va a tener el grupo
        [HttpPut("{id}")]
        //[Authorize(Policy = "EditarGrupo")]
        public async Task<ActionResult<GrupoDto>> Update(int id, GrupoUpdateDto grupoUpdateDto)
        {
            // FluentValidation
            var validationResult = await _updateValidator.ValidateAsync(grupoUpdateDto);
            if (!validationResult.IsValid)
                return BadRequest(validationResult.Errors.Select(e => e.ErrorMessage));

            var result = await _grupoService.Update(id, grupoUpdateDto);

            return (result == null)
                ? NotFound()
                : Ok(result);
        }

        // Front: Botón para eliminar un grupo existente, con una confirmación antes de eliminar
        [HttpDelete("{id}")]
        [Authorize(Policy = "EliminarGrupo")]
        public async Task<ActionResult<GrupoDto>> Delete(int id)
        {
            if (!_grupoService.ValidateDelete(id))
                return Conflict(_grupoService.Errors); // 409 Conflict: reglas de negocio que impiden la operación

            var result = await _grupoService.Delete(id);
            return (result == null)
                ? NotFound()
                : Ok(result);
        }
    }
}
