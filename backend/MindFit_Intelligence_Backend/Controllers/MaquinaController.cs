using Azure;
using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Components.Forms;
using Microsoft.AspNetCore.Mvc;
using MindFit_Intelligence_Backend.DTOs.Maquinas;
using MindFit_Intelligence_Backend.Services.Interfaces;
using System.Runtime.ConstrainedExecution;

namespace MindFit_Intelligence_Backend.Controllers
{
    /// Módulo de Gestión del Gimnasio
    [Route("api/[controller]")]
    [ApiController]
    public class MaquinaController : ControllerBase
    {
        private readonly IMaquinaService _maquinaService;
        private readonly IValidator<MaquinaInsertDto> _insertValidator;
        private readonly IValidator<MaquinaUpdateDto> _updateValidator;

        public MaquinaController(
            IMaquinaService maquinaService,
            IValidator<MaquinaInsertDto> insertValidator,
            IValidator<MaquinaUpdateDto> updateValidator)
        {
            _maquinaService = maquinaService;
            _insertValidator = insertValidator;
            _updateValidator = updateValidator;
        }

        // Testeado --> Anda bien
        /* Front: Para el grid o Selector (Dropdown) de máquinas.
        Esto puede estar en:
        - Inventario --> Máquinas --> Grid
        - Gestionar Ejercicios --> Selector de máquinas ya sea para Crear o Editar un Ejericicio */
        [HttpGet]
        [Authorize]
        public async Task<ActionResult<IEnumerable<MaquinaDto>>> Get()
        {
            var maquinas = await _maquinaService.GetMaquinasAsync();
            return Ok(maquinas);
        }

        // Testeado --> Anda bien
        // Front: No creo que lo use porque el detalle ya se trae en el grid o Selector.
        [HttpGet("{id}")]
        public async Task<ActionResult<MaquinaDto>> GetById(int id)
        {
            var maquina = await _maquinaService.GetMaquinaByIdAsync(id);
            if (maquina == null)
                return NotFound(_maquinaService.Errors);

            return Ok(maquina);
        }

        // Testeado --> Anda bien
        // Front: Para el formulario de creación de máquina.
        [HttpPost]
        [Authorize(Policy = "CrearMaquina")]
        public async Task<ActionResult<MaquinaDto>> Add(MaquinaInsertDto dto)
        {
            var validationResult = await _insertValidator.ValidateAsync(dto);
            if (!validationResult.IsValid)
                return BadRequest(validationResult.Errors.Select(e => e.ErrorMessage));

            if (!_maquinaService.Validate(dto))
                return BadRequest(_maquinaService.Errors);

            var result = await _maquinaService.CreateMaquinaAsync(dto);
            return Ok(result);
        }

        // Testeado --> Anda bien
        // Front: Para el formulario de edición de máquina.
        [HttpPut("{id}")]
        [Authorize(Policy = "EditarMaquina")]
        public async Task<ActionResult<MaquinaDto>> Update(int id, MaquinaUpdateDto dto)
        {
            var validationResult = await _updateValidator.ValidateAsync(dto);
            if (!validationResult.IsValid)
                return BadRequest(validationResult.Errors.Select(e => e.ErrorMessage));

            if (!_maquinaService.Validate(dto))
                return BadRequest(_maquinaService.Errors);

            var result = await _maquinaService.UpdateMaquinaAsync(id, dto);
            if (result == null)
                return NotFound(_maquinaService.Errors);

            return Ok(result);
        }

        // Testeado --> Anda bien
        // Front: Para eliminar una maquina desde el grid.
        [HttpDelete("{id}")]
        [Authorize(Policy = "EliminarMaquina")]
        public async Task<ActionResult<MaquinaDto>> Delete(int id)
        {
            var maquinaEliminada = await _maquinaService.DeleteMaquinaAsync(id);
            if (maquinaEliminada == null)
                return NotFound(_maquinaService.Errors);

            return Ok(maquinaEliminada);
        }
    }
}