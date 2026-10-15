using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MindFit_Intelligence_Backend.DTOs.TipoEjercicio;
using MindFit_Intelligence_Backend.Services.Interfaces;

namespace MindFit_Intelligence_Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TipoEjercicioController : ControllerBase
    {
        private readonly ITipoEjercicioService _tipoEjercicioService;

        public TipoEjercicioController(ITipoEjercicioService tipoEjercicioService)
        {
            _tipoEjercicioService = tipoEjercicioService;
        }

        // Front: Ejercicio necesita IdTipoEjercicio, por eso se obtiene la lista completa de tipos de ejercicio para asignar internamente en el front el tipo de ejercicio segun la opcion que elijio el Entrenador.
        // Testeado --> Anda bien
        [Authorize]
        [HttpGet]
        public async Task<ActionResult<IEnumerable<TipoEjercicioDto>>> Get()
        {
            var tiposEjercicio = await _tipoEjercicioService.GetAsync();
            return Ok(tiposEjercicio);
        }

        // Front: No creo que lo use. Si se necesita, se puede agregar un endpoint para obtener un tipo de ejercicio por su Id.
        // Testeado --> Anda bien
        [HttpGet("{id}")]
        public async Task<ActionResult<TipoEjercicioDto>> GetById(int id)
        {
            var tipoEjercicio = await _tipoEjercicioService.GetByIdAsync(id);

            if (tipoEjercicio == null)
            {
                return NotFound(new { Errors = _tipoEjercicioService.Errors });
            }

            return Ok(tipoEjercicio);
        }
    }
}
