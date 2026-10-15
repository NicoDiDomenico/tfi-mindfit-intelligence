using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using MindFit_Intelligence_Backend.DTOs.Permisos;
using MindFit_Intelligence_Backend.Services.Interfaces;

namespace MindFit_Intelligence_Backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PermisoController : ControllerBase
    {
        private IPermisoService _permisoService;

        public PermisoController(IPermisoService permisoService)
        {
            _permisoService = permisoService;
        }

        /* Front:
            - Front: Para asociar permisos a checkboxes
        */
        [HttpGet]
        [Authorize]
        public async Task<ActionResult<IEnumerable<PermisoDto>>> Get()
        {
            var permisosDtos = await _permisoService.Get();

            return !permisosDtos.Any() ? NotFound("No hay permisos cargados") : Ok(permisosDtos);
        }
    }
}
