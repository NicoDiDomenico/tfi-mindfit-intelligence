using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MindFit_Intelligence_Backend.DTOs.Turno;
using MindFit_Intelligence_Backend.Models;
using MindFit_Intelligence_Backend.Services;
using MindFit_Intelligence_Backend.Services.Interfaces;
using System.Security.Claims;

namespace MindFit_Intelligence_Backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class TurnoController : ControllerBase
    {
        private readonly ITurnoService _turnoService;

        public TurnoController(ITurnoService turnoService)
        {
            _turnoService = turnoService;
        }

        // CUD06 - Gestionar Turno - Asistente
        // Front: Se trae una grilla de historial de los turnos del Socio seleccionado. Alli esta la opcion del boton de reservar turno
        [Authorize]
        [HttpGet("asistente/{idUsuarioSocio}")]
        public async Task<ActionResult<IEnumerable<TurnoDto>>> AsistenteGetTurnos(int idUsuarioSocio)
        {
            var turnos = await _turnoService.GetTurnosByIdUsuarioSocio(idUsuarioSocio);

            return (turnos is null) ? NotFound() : Ok(turnos);
        }

        // CUD06 - Gestionar Turno - Socio
        // Front: Se trae una grilla de historial de los turnos del Socio logueado. Alli esta la opcion del boton de reservar turno
        [Authorize]
        [HttpGet("socio")]
        public async Task<ActionResult<IEnumerable<TurnoDto>>> SocioGetTurnos()
        {
            var claimIdUsuario = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (!int.TryParse(claimIdUsuario, out var idUsuarioSocio))
                return Unauthorized();

            var turnos = await _turnoService.GetTurnosByIdUsuarioSocio(idUsuarioSocio);

            return (turnos is null) ? NotFound() : Ok(turnos);
        }

        /*
         CUD07 - Agregar Turno - Asistente
         Front: Se apreta el boton de reservar turno, para armar el dto se necesita:
         IdDiaRangoHorario -> se consigue con un select de rangos horarios desde GET api/DiaRangoHorario/grilla-por-dia.
         IdUsuarioResponsable -> se consigue con un select para elegir el responsable, desde List<GrillaDiaRangoHorarioResponsableDto> Responsables del dto del endpoint anterior
         IdUsuarioSocio -> se consigue de:
            Modulo Gestionar Turno Asistente - Con un select para elegir el socio. Se arma con los datos de los usuarios que son socios desde GET api/Usuario/grilla-socio
         */
        [Authorize(Policy = "AgregarTurno")]
        [HttpPost("asistente/registrar")]
        public async Task<ActionResult<TurnoDto>> AsistenteRegistraTurno(TurnoInsertDto turnoInsertDto)
        {
            if (!await _turnoService.ValidateAsync(turnoInsertDto))
                return Conflict(_turnoService.Errors);

            var turno = await _turnoService.RegistrarTurno(turnoInsertDto);
            if (turno is null)
                return Conflict(_turnoService.Errors);

            return Ok(turno);
        }

        /*
         CUD07 - Agregar Turno - Socio
         Front: Se apreta el boton de reservar turno, para armar el dto se necesita:
         IdDiaRangoHorario -> se consigue con un select de rangos horarios desde GET api/DiaRangoHorario/grilla-por-dia.
         IdUsuarioResponsable -> se consigue con un select para elegir el responsable, desde List<GrillaDiaRangoHorarioResponsableDto> Responsables del dto del endpoint anterior
         IdUsuarioSocio -> se consigue de:
            Modulo Gestionar Turno Socio - Con el id del usuario que esta logueado, que se puede sacar del token. POST api/Auth/login
         */
        [Authorize(Policy = "SoloSocio")]
        [HttpPost("socio/registrar")]
        public async Task<ActionResult<TurnoDto>> SocioRegistraTurno(TurnoInsertDto turnoInsertDto)
        {
            var claimIdUsuario = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (!int.TryParse(claimIdUsuario, out var idUsuarioSocio))
                return Unauthorized();

            turnoInsertDto.IdUsuarioSocio = idUsuarioSocio;

            if (!await _turnoService.ValidateAsync(turnoInsertDto))
                return Conflict(_turnoService.Errors);

            var turno = await _turnoService.RegistrarTurno(turnoInsertDto);
            if (turno is null)
                return Conflict(_turnoService.Errors);

            return Ok(turno);
        }

        /// CUD08 - Eliminar Turno - Asistente
        /* Front: Se apreta el boton de cancelar turno, se muestra un mensaje de confirmacion "¿Confirma que desea cancelar este turno?" y se cancela el turno seleccionado.
           Esto se hace desde el módulo del Asistente.
         */
        [Authorize(Policy = "CancelarTurno")] // Política para proteger el endpoint
        [HttpPatch("asistente/cancelar/{idTurno}")]
        public async Task<ActionResult> AsistenteCancelarTurno(int idTurno)
        {
            // El servicio se encarga de validar la antelación (RN13), cancelar, liberar cupo y guardar.
            var resultado = await _turnoService.CancelarTurno(idTurno);

            if (!resultado)
            {
                // Si la lista de errores tiene algo, es porque falló una regla de negocio (ej: menos de 3 hs)
                if (_turnoService.Errors.Any())
                    return Conflict(new { message = _turnoService.Errors });

                // Si no hay errores pero devolvió false, es porque el ID no existe en la BD
                return NotFound($"No se encontró el turno con ID: {idTurno}");
            }

            return NoContent(); // 204 No Content - Éxito sin cuerpo de respuesta
        }

        /// CUD08 - Eliminar Turno - Socio
        /* Front: Se apreta el boton de cancelar turno, se muestra un mensaje de confirmacion "¿Confirma que desea cancelar este turno?" y se cancela el turno seleccionado.
           Esto se hace desde el módulo del Socio.
         */
        [Authorize(Policy = "SoloSocio")] // Política para proteger el endpoint
        [HttpPatch("socio/cancelar/{idTurno}")]
        public async Task<ActionResult> SocioCancelarTurno(int idTurno)
        {
            // El servicio se encarga de validar la antelación (RN13), cancelar, liberar cupo y guardar.
            var resultado = await _turnoService.CancelarTurno(idTurno);

            if (!resultado)
            {
                // Si la lista de errores tiene algo, es porque falló una regla de negocio (ej: menos de 3 hs)
                if (_turnoService.Errors.Any())
                    return Conflict(new { message = _turnoService.Errors });

                // Si no hay errores pero devolvió false, es porque el ID no existe en la BD
                return NotFound($"No se encontró el turno con ID: {idTurno}");
            }

            return NoContent(); // 204 No Content - Éxito sin cuerpo de respuesta
        }

        // Documentado
        // CUD09 – Validar Ingreso del Socio
        [Authorize(Policy = "ValidarIngreso")]
        [HttpPost("validar-ingreso")]
        public async Task<IActionResult> ValidarIngreso([FromBody] ValidarIngresoDto dto)
        {
            var resultado = await _turnoService.ValidarIngresoAsync(dto);

            if (!resultado)
            {
                // Si la lista de errores tiene algo, es porque falló una regla de negocio
                if (_turnoService.Errors.Any())
                    return Conflict(new { message = _turnoService.Errors });

                // Si no hay errores pero devolvió false, es porque el DNI no existe en la BD
                return NotFound(new { message = $"No se encontró el turno del DNI: {dto.DniSocio}" });
            }

            return Ok(new { message = "Se ha validado exitosamente el ingreso del socio." });
        }


        // Acá falta un endpoint que recorra todos los turnos y si hay tunros con estado EnCurso pero que ya se les paso la fecha de asistencia entonces pasar el estado de los turnos venciso a "Vencido"
        [Authorize]
        [HttpPatch("procesar-turnos-vencidos")]
        public async Task<ActionResult> ProcesarTurnosVencidos()
        {
            try
            {
                int turnosProcesados = await _turnoService.ProcesarTurnosVencidos();
                return Ok(new { mensaje = $"Turnos vencidos procesados correctamente: {turnosProcesados}" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Error al procesar turnos vencidos", detalle = ex.Message });
            }
        }


        // Front: Grilla general de los turnos del día actual (ideal para el dashboard del Asistente)
        [AllowAnonymous]
        [HttpGet("inicio/grilla-fecha")]
        public async Task<ActionResult<IEnumerable<TurnoDetalleDto>>> AsistenteGetTurnosPorFecha([FromQuery] DateTime? fecha)
        {
            var turnos = await _turnoService.GetTurnosPorFechaAsync(fecha);

            if (turnos == null || !turnos.Any())
                return NotFound(new { message = "No se encontraron turnos registrados para la fecha especificada." });

            return Ok(turnos);
        }
    }
}