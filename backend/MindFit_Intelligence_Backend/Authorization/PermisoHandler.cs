using Microsoft.AspNetCore.Authorization;
using MindFit_Intelligence_Backend.Services.Interfaces;
using System.Security.Claims;

namespace MindFit_Intelligence_Backend.Authorization
{
    public class PermisoHandler : AuthorizationHandler<PermisoRequirement>
    {
        private readonly IUsuarioService _usuarioService;

        public PermisoHandler(IUsuarioService usuarioService)
        {
            _usuarioService = usuarioService;
        }

        protected override async Task HandleRequirementAsync(
            AuthorizationHandlerContext context,
            PermisoRequirement requirement)
        {
            // Extraemos el ID y lo convertimos a número inmediatamente
            var userIdString = context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            // Si no hay ID o no se puede convertir a número, salimos (no autorizado)
            if (!int.TryParse(userIdString, out int userId))
            {
                return;
            }

            // Ahora mandamos solo el NÚMERO a la capa de servicios
            var tienePermiso = await _usuarioService.UsuarioTienePermiso(userId, requirement.Permiso);

            if (tienePermiso)
                context.Succeed(requirement);
        }
    }
}
