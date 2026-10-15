using Microsoft.AspNetCore.Http;
using MindFit_Intelligence_Backend.Services.Interfaces;
using System.Linq;
using System.Threading.Tasks;

namespace MindFit_Intelligence_Backend.Middleware
{
    public class TenantMiddleware
    {
        private readonly RequestDelegate _next;

        public TenantMiddleware(RequestDelegate next)
        {
            _next = next;
        }

        public async Task InvokeAsync(HttpContext context, ITenantResolver tenantResolver, ITenantContext tenantContext)
        {
            // 1) Intentar leer IdGym desde header personalizado
            string? gymIdStr = context.Request.Headers["X-Gym-Id"].FirstOrDefault();

            // 2) Si no viene por header, intentar leer del claim (JWT)
            if (string.IsNullOrEmpty(gymIdStr))
            {
                gymIdStr = context.User?.FindFirst("IdGimnasio")?.Value
                           ?? context.User?.FindFirst("IdGym")?.Value;
            }

            if (int.TryParse(gymIdStr, out int idGimnasio))
            {
                var conn = await tenantResolver.ResolveConnectionStringAsync(idGimnasio);
                if (!string.IsNullOrEmpty(conn))
                {
                    tenantContext.SetTenant(idGimnasio, conn);
                }
            }

            await _next(context);
        }
    }
}