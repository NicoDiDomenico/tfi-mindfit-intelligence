using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using MindFit_Intelligence_Backend.DTOs.Dia;
using MindFit_Intelligence_Backend.Services.Interfaces;

namespace MindFit_Intelligence_Backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class DiaController : ControllerBase
    {
        private readonly IDiaService _diaService;

        public DiaController(IDiaService diaService)
        {
            _diaService = diaService;
        }

        // Documentado
        // Testeado --> Anda bien
        // CUD02 - Paso 1 Front: Sirve para mostrar en los CheckBoxes de Dias del formulario de usuario, el listado de dias disponibles para asignar a la rutina del usuario
        // CUD11 Consultar Rutina - Paso 5: Las rutinas se asignan a los días de la semana, por lo que es necesario colocar cada dia a un boton, y el boton clickeado enviara el id del dia para traer la rutina del usuario
        [Authorize]
        [HttpGet("dias")]
        public async Task<ActionResult<IEnumerable<DiaDto>>> GetDias()
        {
            IEnumerable<DiaDto> diaDtos = await _diaService.GetDias();

            return Ok(diaDtos);
        }
    }
}
