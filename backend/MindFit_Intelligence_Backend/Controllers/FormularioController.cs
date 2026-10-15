using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MindFit_Intelligence_Backend.DTOs.Formularios;
using MindFit_Intelligence_Backend.Services.Interfaces;

namespace MindFit_Intelligence_Backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class FormularioController : ControllerBase
    {
        private readonly IFormularioService _formularioService;

        public FormularioController(IFormularioService formularioService)
        {
            _formularioService = formularioService;
        }

        [HttpGet]
        [AllowAnonymous]
        public async Task<ActionResult<IEnumerable<FormularioDto>>> Get()
        {
            var formulariosDtos = await _formularioService.Get();

            return !formulariosDtos.Any()
                ? NotFound("No hay formularios con permisos cargados")
                : Ok(formulariosDtos);
        }
    }
}
