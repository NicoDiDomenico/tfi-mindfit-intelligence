using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MindFit_Intelligence_Backend.DTOs.Equipamientos;
using MindFit_Intelligence_Backend.Services.Interfaces;

namespace MindFit_Intelligence_Backend.Controllers
{
    /// Módulo de Gestión del Gimnasio
    [Route("api/[controller]")]
    [ApiController]
    public class EquipamientoController : ControllerBase
    {
        private readonly IEquipamientoService _equipamientoService;
        private readonly IValidator<EquipamientoInsertDto> _insertValidator;
        private readonly IValidator<EquipamientoUpdateDto> _updateValidator;

        public EquipamientoController(
            IEquipamientoService equipamientoService,
            IValidator<EquipamientoInsertDto> insertValidator,
            IValidator<EquipamientoUpdateDto> updateValidator)
        {
            _equipamientoService = equipamientoService;
            _insertValidator = insertValidator;
            _updateValidator = updateValidator;
        }

        // Testeado --> Anda bien
        /* Front: Para el grid o Selector (Dropdown) de equipamientos.
        Esto puede estar en:
        - Inventario --> Equipamiento --> Grid
        - Gestionar Ejercicios --> Selector de equipamientos ya sea para Crear o Editar un Ejericicio */
        [Authorize]
        [HttpGet]
        public async Task<ActionResult<IEnumerable<EquipamientoDto>>> Get()
        {
            var equipamientos = await _equipamientoService.GetEquipamientosAsync();
            return Ok(equipamientos);
        }

        // Testeado --> Anda bien
        // Front: No creo que lo use porque el detalle ya se trae en el grid.
        [HttpGet("{id}")]
        public async Task<ActionResult<EquipamientoDto>> GetById(int id)
        {
            var equipamiento = await _equipamientoService.GetEquipamientoByIdAsync(id);
            if (equipamiento == null)
                return NotFound(_equipamientoService.Errors);

            return Ok(equipamiento);
        }

        // Testeado --> Anda bien
        // Front: Para el formulario de creación de equipamientos.
        [HttpPost]
        [Authorize(Policy = "CrearEquipamiento")]
        public async Task<ActionResult<EquipamientoDto>> Add(EquipamientoInsertDto dto)
        {
            var validationResult = await _insertValidator.ValidateAsync(dto);
            if (!validationResult.IsValid)
                return BadRequest(validationResult.Errors.Select(e => e.ErrorMessage));

            if (!_equipamientoService.Validate(dto))
                return BadRequest(_equipamientoService.Errors);

            var result = await _equipamientoService.CreateEquipamientoAsync(dto);
            if (result == null)
                return BadRequest(_equipamientoService.Errors);

            return Ok(result);
        }

        // Testeado --> Anda bien
        // Front: Para el formulario de edición de equipamientos.
        [HttpPut("{id}")]
        [Authorize(Policy = "EditarEquipamiento")]
        public async Task<ActionResult<EquipamientoDto>> Update(int id, EquipamientoUpdateDto dto)
        {
            var validationResult = await _updateValidator.ValidateAsync(dto);
            if (!validationResult.IsValid)
                return BadRequest(validationResult.Errors.Select(e => e.ErrorMessage));

            if (!_equipamientoService.Validate(dto))
                return BadRequest(_equipamientoService.Errors);

            var result = await _equipamientoService.UpdateEquipamientoAsync(id, dto);
            if (result == null)
                return NotFound(_equipamientoService.Errors);

            return Ok(result);
        }

        // Testeado --> Anda bien
        // Front: Para eliminar un equipamiento desde el grid.
        [HttpDelete("{id}")]
        [Authorize(Policy = "EliminarEquipamiento")]
        public async Task<ActionResult<EquipamientoDto>> Delete(int id)
        {
            var equipamientoEliminado = await _equipamientoService.DeleteEquipamientoAsync(id);
            if (equipamientoEliminado == null)
                return NotFound(_equipamientoService.Errors);

            return Ok(equipamientoEliminado);
        }
    }
}