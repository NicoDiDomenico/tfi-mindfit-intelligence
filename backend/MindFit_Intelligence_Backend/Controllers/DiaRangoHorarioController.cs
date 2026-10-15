using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using MindFit_Intelligence_Backend.DTOs.DiaRangoHorario;
using MindFit_Intelligence_Backend.DTOs.DiaRangoHorarioResponsable;
using MindFit_Intelligence_Backend.DTOs.Usuarios;
using MindFit_Intelligence_Backend.Services;
using MindFit_Intelligence_Backend.Services.Interfaces;

namespace MindFit_Intelligence_Backend.Controllers
{
    // Modulo Gestion Gimnasio, necesario para CUDs 6-7-8
    [Route("api/[controller]")]
    [ApiController]
    public class DiaRangoHorarioController : ControllerBase
    {
        private IDiaRangoHorarioService _diaRangoHorarioService;

        public DiaRangoHorarioController(IDiaRangoHorarioService diaRangoHorarioService)
        {
            _diaRangoHorarioService = diaRangoHorarioService;
        }

        // Chequeado --> Anda bien
        // Front: Grilla de Dias Rango Horarios para asignarles Entrenadores o Desactivar rangos horarios
        // IMPORTANTE: Esta grilla se complementa con un endpoint GET "api/PersonaResponsable/entrenadores" que trae TODOS los entrenadores, ya que la idea es asociarlos desde el front
        [Authorize]
        [HttpGet("grilla")]
        public async Task<ActionResult<IEnumerable<GrillaDiaRangoHorarioDto>>> GetAll()
        {
            var diaRangoHorarioDto = await _diaRangoHorarioService.GetAll();
            return Ok(diaRangoHorarioDto);
        }

        // Chequeado --> Anda bien
        // Front: Obtener rangos horarios para registrar turno de un día específico.
        // Si no se envía fecha, se utiliza el día actual del sistema.
        [Authorize]
        [HttpGet("grilla-por-dia")]
        public async Task<ActionResult<IEnumerable<GrillaDiaRangoHorarioDto>>> GetByDia([FromQuery] DateTime? fecha)
        {
            var fechaConsulta = fecha?.Date ?? DateTime.Today;
            var diaRangoHorarioDto = await _diaRangoHorarioService.GetByFecha(fechaConsulta);
            return Ok(diaRangoHorarioDto);
        }

        // Front: Activar o Desactivar un rango horario para que no se le puedan asignar Turnos a los entrenadores en ese rango horario
        [Authorize(Policy = "ModificarDiaRangoHorario")]
        [HttpPatch("cambiar-estado/{IdDiaRangoHorario}")]
        public async Task<ActionResult> ActivarDesactivarHorario(int IdDiaRangoHorario, DiaRangoHorarioUpdateDto dto)
        {
            var resultado = await _diaRangoHorarioService.ActivarDesactivarHorario(IdDiaRangoHorario, dto);

            if (!resultado)
                return NotFound(_diaRangoHorarioService.Errors);

            return NoContent();
        }

        // Chequeado --> Anda bien
        // Front: Asignar un entrenador a un dia rango horario específico. Requiere de GET api/PersonaResponsable/entrenadores + GET api/DiaRangoHorario/grilla
        [Authorize(Policy = "ModificarDiaRangoHorario")]
        [HttpPost("asignar-responsable")]
        public async Task<ActionResult> AsignarResponsable([FromBody] DiaRangoHorarioResponsableInsertDto dto)
        {
            var resultado = await _diaRangoHorarioService.AsignarResponsable(dto);

            if (!resultado)
                return Conflict("El responsable ya está asignado a este rango horario.");

            return NoContent();
        }

        // NO SE VA A IMPLEMENTAR
        // Front: Actualizar las observaciones de un responsable asignado
        [Authorize(Policy = "ModificarDiaRangoHorario")]
        [HttpPatch("actualizar-responsable")]
        public async Task<ActionResult> ActualizarResponsable([FromBody] DiaRangoHorarioResponsableUpdateDto dto)
        {
            var resultado = await _diaRangoHorarioService.ActualizarResponsable(dto);

            if (!resultado)
                return NotFound("No se encontró la asignación del responsable en este rango horario.");

            return NoContent();
        }

        // Front: Quitar un entrenador a un dia rango horario específico
        [Authorize(Policy = "QuitarEntrenadorDiaRangoHorario")]
        [HttpDelete("quitar-responsable")]
        public async Task<ActionResult> QuitarResponsable([FromBody] DiaRangoHorarioResponsableDeleteDto dto)
        {
            var resultado = await _diaRangoHorarioService.QuitarResponsable(dto);

            if (!resultado)
                return NotFound("No se encontró la asignación del responsable en este rango horario.");

            return NoContent();
        }
    }
}
