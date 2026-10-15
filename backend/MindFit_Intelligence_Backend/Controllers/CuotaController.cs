using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MindFit_Intelligence_Backend.DTOs.Cuota;
using MindFit_Intelligence_Backend.Services.Interfaces;

namespace MindFit_Intelligence_Backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CuotaController : ControllerBase
    {
        private readonly ICuotaService _cuotaService;

        public CuotaController(ICuotaService cuotaService)
        {
            _cuotaService = cuotaService;
        }

        // No lo voy a implementar en el front
        // Front: Obtener historial de cuotas de un socio
        [Authorize]
        [HttpGet("socio/{idUsuario}")]
        public async Task<ActionResult<IEnumerable<CuotaDto>>> GetBySocio(int idUsuario)
        {
            IEnumerable<CuotaDto> cuotas = await _cuotaService.GetBySocio(idUsuario);
            return Ok(cuotas);
        }

        // No lo voy a implementar en el front
        // Front: Obtener detalle de una cuota
        [Authorize]
        [HttpGet("{id}")]
        public async Task<ActionResult<CuotaDto>> GetById(int id)
        {
            CuotaDto? cuotaDto = await _cuotaService.GetById(id);
            return cuotaDto == null ? NotFound() : Ok(cuotaDto);
        }

        // Front: Actualiza a Estado VENCIDO las cuotas con estado VIGENTE y suspende al socio correspondiente (esto tiene que ser algo interno del front para mi)
        // ESTADO SOCIO NUEVO/ACTUALIZADO A SUSPENDIDO
        [Authorize]
        [HttpPut("actualizar-vencidas")]
        public async Task<ActionResult> ActualizarCuotasVencidas()
        {
            int cantidad = await _cuotaService.ActualizarCuotasVencidas();
            return Ok(new { cuotasActualizadas = cantidad }); // Como es interno tiene mas sentido que no devuelva nada, pero por ahora lo dejo asi para probarlo desde el front
        }

        // No lo voy a implementar en el front
        // Front: Eliminar cuota
        [Authorize(Policy = "EliminarCuota")]
        [HttpDelete("{id}")]
        public async Task<ActionResult<CuotaDto>> Delete(int id)
        {
            CuotaDto? cuotaDto = await _cuotaService.Delete(id);
            return cuotaDto == null ? NotFound() : Ok(cuotaDto);
        }
    }
}
