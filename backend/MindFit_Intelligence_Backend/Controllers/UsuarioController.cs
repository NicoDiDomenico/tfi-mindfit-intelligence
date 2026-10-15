using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MindFit_Intelligence_Backend.DTOs.Dia;
using MindFit_Intelligence_Backend.DTOs.Usuarios;
using MindFit_Intelligence_Backend.Models;
using MindFit_Intelligence_Backend.Services;
using MindFit_Intelligence_Backend.Services.Interfaces;
using System.Security.Claims;

namespace MindFit_Intelligence_Backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UsuarioController : ControllerBase
    {
        private readonly IUsuarioService _usuarioService;
        private readonly IValidator<UsuarioInsertDto> _insertValidator;
        private readonly IValidator<UsuarioUpdateDto> _updateValidator;

        public UsuarioController(
            IUsuarioService usuarioService,
            IValidator<UsuarioInsertDto> insertValidator,
            IValidator<UsuarioUpdateDto> updateValidator)
        {
            _usuarioService = usuarioService;
            _insertValidator = insertValidator;
            _updateValidator = updateValidator;
        }

        // MOVI TODO A diaController.cs
        // Testeado --> Anda bien
        /// CUD02 - Paso 1
        // Front: Sirve para mostrar en el GrupoBox de Dias del formulario de usuario, el listado de dias disponibles para asignar a la rutina del usuario
        //[Authorize]
        /*[HttpGet("dias")]
        public async Task<ActionResult<IEnumerable<DiaDto>>> GetDias()
        {
            IEnumerable<DiaDto> diaDtos = await _usuarioService.GetDias();

            return Ok(diaDtos);
        }
        */

        /// No pertenece a ningun CUD, lo deje impementado por si un modulo necesita motrar todos los usuarios
        // Front: Mostrar listado esencial de usuarios en grilla, con paginación, ordenamiento y filtros
        //[Authorize]
        [HttpGet("grilla-usuarios")]
        public async Task<ActionResult<List<UsuarioGridDto>>> GetUsuariosGrid()
        {
            List<UsuarioGridDto> usuariosGridDto = await _usuarioService.GetUsuariosGrid();

            return Ok(usuariosGridDto);
        }

        /// Esto no pertenece a un CUD pero si al Modulo de Gestion del Gimnasio
        //[Authorize]
        [HttpGet("grilla-responsable")]
        public async Task<ActionResult<List<ResponsableGridDto>>> GetUsuariosResponsablesGrid()
        {
            List<ResponsableGridDto> dto = await _usuarioService.GetUsuariosResponsablesGrid();
            return Ok(dto);
        }

        // Documentado
        /// CUD01 - Paso 4
        /// CUD02 - Paso 1 y CUD03
        // Front: Mostrar listado esencial de socios en grilla NO ELIMINADOS, con paginación, ordenamiento y filtros. Para mostrar todos se muestra un icono de "Ver socios eliminados" para hacerlo visibles en la grilla
        [Authorize]
        [HttpGet("grilla-socio")]
        public async Task<ActionResult<List<SocioGridDto>>> GetUsuariosSocioGrid()
        {
            List<SocioGridDto> dto = await _usuarioService.GetUsuariosSociosGrid();
            return Ok(dto);
        }

        // Documentado
        /// CUD03 - Paso 4
        // Front: Mostrar detalle de usuario en el formulario al hacer click en la grilla
        [Authorize]
        [HttpGet("{idUsuario}")]
        public async Task<ActionResult<UsuarioDto?>> GetUsuarioById(int idUsuario)
        {
            UsuarioDto? usuarioDetalleDto = await _usuarioService.GetUsuarioById(idUsuario);

            return usuarioDetalleDto == null
                ? NotFound()
                : Ok(usuarioDetalleDto);
        }

        // Documentado
        // Testeado --> Anda bien
        // Front: Crear nuevo usuario Responsable desde el formulario de Gestionar Gimnasio --> Usuarios
        //[Authorize(Policy = "CrearUsuarioResponsable")]
        [HttpPost("responsable/register")]
        public async Task<ActionResult<UsuarioDto>> RegisterResponsable(UsuarioInsertDto usuarioInsertDto)
        {
            // Validation Pattern
            if (!_usuarioService.Validate(usuarioInsertDto))
                return Conflict(_usuarioService.Errors);

            // FluentValidation
            var validationResult = await _insertValidator.ValidateAsync(usuarioInsertDto);
            if (!validationResult.IsValid)
                return BadRequest(validationResult.Errors.Select(e => e.ErrorMessage));

            // NEW EMAIL VALIDATION
            if (!await _usuarioService.ValidateEmailAsync(usuarioInsertDto))
                return Conflict(_usuarioService.Errors);

            UsuarioDto? usuarioDto = await _usuarioService.Add(usuarioInsertDto);

            if (_usuarioService.Errors.Any())
                return StatusCode(500, _usuarioService.Errors);

            return CreatedAtAction(
                nameof(GetUsuarioById),
                new { idUsuario = usuarioDto!.IdUsuario },
                usuarioDto
            );
        }

        // Documentado
        // Testeado --> Anda bien
        /// CUD02 Paso 3 al 8
        // Front: Crear nuevo usuario desde el formulario de Ver Socios --> Agregar Socio
        //[Authorize(Policy = "CrearUsuarioSocio")]
        [HttpPost("socio/register")]
        public async Task<ActionResult<UsuarioDto>> RegisterSocio(UsuarioInsertDto usuarioInsertDto)
        {
            // Validation Pattern
            if (!_usuarioService.Validate(usuarioInsertDto))
                return Conflict(_usuarioService.Errors);

            // FluentValidation
            var validationResult = await _insertValidator.ValidateAsync(usuarioInsertDto);
            if (!validationResult.IsValid)
                return BadRequest(validationResult.Errors.Select(e => e.ErrorMessage));

            // NEW EMAIL VALIDATION
            if (!await _usuarioService.ValidateEmailAsync(usuarioInsertDto))
                return Conflict(_usuarioService.Errors);

            UsuarioDto? usuarioDto = await _usuarioService.Add(usuarioInsertDto);

            if (_usuarioService.Errors.Any())
                return StatusCode(500, _usuarioService.Errors);

            return CreatedAtAction(
                nameof(GetUsuarioById),
                new { idUsuario = usuarioDto!.IdUsuario },
                usuarioDto
            );
        }

        // Documentado
        // Testeado --> Anda bien
        // Front: Editar usuario Responsable desde el formulario de Gestionar Gimnasio --> Usuarios
        [Authorize(Policy = "EditarUsuarioResponsable")]
        [HttpPut("responsable/{idUsuario}")]
        public async Task<ActionResult<UsuarioDto?>> UpdateResponsable(int idUsuario, UsuarioUpdateDto usuarioUpdateDto)
        {
            // Validation Pattern
            if (!_usuarioService.Validate(usuarioUpdateDto))
                return Conflict(_usuarioService.Errors);

            // FluentValidation
            var validationResult = await _updateValidator.ValidateAsync(usuarioUpdateDto);
            if (!validationResult.IsValid)
                return BadRequest(validationResult.Errors.Select(e => e.ErrorMessage));

            // NEW EMAIL VALIDATION
            if (!await _usuarioService.ValidateEmailAsync(idUsuario, usuarioUpdateDto))
                return Conflict(_usuarioService.Errors);

            UsuarioDto? usuarioDto = await _usuarioService.Update(idUsuario, usuarioUpdateDto);

            if (_usuarioService.Errors.Any())
                return StatusCode(500, _usuarioService.Errors);

            return usuarioDto == null ? NotFound() : Ok(usuarioDto);
        }

        // Documentado
        // Testeado --> Anda bien
        /// CUD04
        // Front: Editar usuario Socio desde el formulario de Ver Socios --> Consultar/Editar Socio
        [Authorize(Policy = "EditarUsuarioSocio")]
        [HttpPut("socio/{idUsuario}")]
        public async Task<ActionResult<UsuarioDto?>> UpdateSocio(int idUsuario, UsuarioUpdateDto usuarioUpdateDto)
        {
            // Validation Pattern
            if (!_usuarioService.Validate(usuarioUpdateDto))
                return Conflict(_usuarioService.Errors);

            // FluentValidation
            var validationResult = await _updateValidator.ValidateAsync(usuarioUpdateDto);
            if (!validationResult.IsValid)
                return BadRequest(validationResult.Errors.Select(e => e.ErrorMessage));

            // NEW EMAIL VALIDATION
            if (!await _usuarioService.ValidateEmailAsync(idUsuario, usuarioUpdateDto))
                return Conflict(_usuarioService.Errors);

            UsuarioDto? usuarioDto = await _usuarioService.Update(idUsuario, usuarioUpdateDto);

            if (_usuarioService.Errors.Any())
                return StatusCode(500, _usuarioService.Errors);

            return usuarioDto == null ? NotFound() : Ok(usuarioDto);
        }

        //// NO LO VOY A USAR, LO REEMPLAZO POR --> CUD05 - Paso Final (Automático)
        // ESTADO SOCIO NUEVO/ACTUALIZADO A SUSPENDIDO --> endpoint "actualizar-vencidas" en CuotaController.cs
        /// CUD05 Paso *.b.
        // Front: El sistema elimina automáticamente a un socio suspendido durante 30
        // ESTADO SOCIO SUSPENDIDO A ELIMINADO (AUTOMATICA)
        /*[AllowAnonymous] // LO AUTOMATICO LO DEJO SIN RESTRICCION DE ROL O POLITICA PORQUE SE EJECUTARIA DEPUES DE CIERTAS CONDICION EN EL FRONT
        [HttpPatch("eliminacion-automatica/{idUsuario}")]
        public async Task<ActionResult<UsuarioDto>> AutoSoftDeleteSocio(int idUsuario)
        {
            if (!await _usuarioService.ValidateDelete(idUsuario))
                return Conflict(_usuarioService.Errors);

            UsuarioDto? usuarioDto = await _usuarioService.AutoSoftDeleteSocio(idUsuario);

            return usuarioDto == null ? NotFound() : Ok(usuarioDto);
        }*/

        /// <summary>
        /// CUD05 - Paso Final (Automático)
        /// Procesa TODOS los socios suspendidos que cumplan la regla de los 30 días
        /// y los marca como ELIMINADOS automáticamente.
        /// Debe ejecutarse ANTES de cargar la grilla de socios en el frontend.
        /// </summary>
        [Authorize] // Interno del sistema
        [HttpPatch("procesar-eliminaciones-pendientes")]
        public async Task<ActionResult<ProcesarEliminacionesDto>> ProcesarEliminacionesPendientes()
        {
            try
            {
                var resultado = await _usuarioService.ProcesarEliminacionesAutomaticas();
                return Ok(resultado);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Error al procesar eliminaciones", detalle = ex.Message });
            }
        }

        /// CUD05
        // Front: Baja lógica de un socio (cambia EstadoSocio a Eliminado).
        // ESTADO SOCIO SUSPENDIDO A ELIMINADO
        //[Authorize(Policy = "EliminarUsuarioSocio")] // Cambiar a una política más específica (opcional)
        [HttpPatch("socio/{idUsuario}/baja")]
        public async Task<ActionResult<UsuarioDto>> SoftDeleteSocio(int idUsuario)
        {
            if (!await _usuarioService.ValidateDelete(idUsuario))
                return Conflict(_usuarioService.Errors);

            UsuarioDto? usuarioDto = await _usuarioService.SoftDeleteSocio(idUsuario);

            return usuarioDto == null ? NotFound() : Ok(usuarioDto);
        }

        // No lo voy a implementar en el front. Porque para recuperarlo que renueve la cuota y se reactive automáticamente.
        // Front: Cuando en la grilla se filtra por "Ver socios eliminados" aparece un boton de recuperacion del socio elimninado
        /* ESTADO SOCIO ELIMINADO A SUSPENDIDO
        [Authorize(Policy = "EliminarUsuarioSocio")]
        [HttpPatch("{idUsuario}/recuperacion")]
        public async Task<ActionResult<UsuarioDto>> RecoverSoftDeletedSocio(int idUsuario)
        {
            if (!await _usuarioService.ValidateRecover(idUsuario))
                return Conflict(_usuarioService.Errors);
            UsuarioDto? usuarioDto = await _usuarioService.RecoverSoftDeletedSocio(idUsuario);
            return usuarioDto == null ? NotFound() : Ok(usuarioDto);
        }
        */

        // Front: Eliminar usuario desde el formulario o boton
        // ELIMINACION DEFINITIVA (ELIMINADO a NO HAY ESTADO)
        [Authorize(Policy = "EliminarUsuarioResponsableDefinitivamente")]
        [HttpDelete("responsable/{idUsuario}")]
        public async Task<ActionResult<UsuarioDto>> DeleteResponsable(int idUsuario)
        {
            if (!await _usuarioService.ValidateDelete(idUsuario))
                return Conflict(_usuarioService.Errors);

            UsuarioDto? usuarioDto = await _usuarioService.Delete(idUsuario);

            return usuarioDto == null ? NotFound() : Ok(usuarioDto);
        }

        // Front: Eliminar usuario desde el formulario o boton
        // ELIMINACION DEFINITIVA (ELIMINADO a NO HAY ESTADO)
        [Authorize(Policy = "EliminarUsuarioSocioDefinitivamente")]
        [HttpDelete("socio/{idUsuario}")]
        public async Task<ActionResult<UsuarioDto>> DeleteSocio(int idUsuario)
        {
            if (!await _usuarioService.ValidateDelete(idUsuario))
                return Conflict(_usuarioService.Errors);

            UsuarioDto? usuarioDto = await _usuarioService.Delete(idUsuario);

            return usuarioDto == null ? NotFound() : Ok(usuarioDto);
        }
    }
}
