using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using MindFit_Intelligence_Backend.Models.Master;
using MindFit_Intelligence_Backend.Services;
using MindFit_Intelligence_Backend.Services.Interfaces;

namespace MindFit_Intelligence_Backend.Middleware
{
    public class SubscriptionAccessMiddleware
    {
        private readonly RequestDelegate _next;

        public SubscriptionAccessMiddleware(RequestDelegate next)
        {
            _next = next;
        }

        public async Task InvokeAsync(
            HttpContext context,
            ITenantContext tenantContext,
            MindFitMasterContext masterContext)
        {
            if (context.User.Identity?.IsAuthenticated != true
                || !tenantContext.IdGimnasio.HasValue
                || IsAllowedPath(context.Request.Path))
            {
                await _next(context);
                return;
            }

            var gym = await masterContext.Gyms
                .FirstOrDefaultAsync(g => g.IdGym == tenantContext.IdGimnasio.Value, context.RequestAborted);

            if (gym is null)
            {
                await _next(context);
                return;
            }

            var now = DateTime.UtcNow;
            var shouldBlock = GymPublicoService.DebeBloquearAcceso(gym, now);

            if (gym.AccesoBloqueadoPorSuscripcion != shouldBlock)
            {
                gym.AccesoBloqueadoPorSuscripcion = shouldBlock;
                gym.FechaBloqueoSuscripcionUtc = shouldBlock ? now : null;
                await masterContext.SaveChangesAsync(context.RequestAborted);
            }

            if (!shouldBlock)
            {
                await _next(context);
                return;
            }

            context.Response.StatusCode = StatusCodes.Status402PaymentRequired;
            context.Response.ContentType = "application/json";

            var response = new
            {
                code = "SUBSCRIPTION_ACCESS_BLOCKED",
                message = "El acceso operativo del gimnasio esta bloqueado por el estado de la suscripcion.",
                estadoSuscripcionPayPal = gym.EstadoSuscripcionPayPal,
                fechaAccesoHastaUtc = gym.FechaAccesoHastaUtc
            };

            await context.Response.WriteAsync(JsonSerializer.Serialize(response), context.RequestAborted);
        }

        private static bool IsAllowedPath(PathString path)
        {
            return path.StartsWithSegments("/api/Gyms/mi-suscripcion", StringComparison.OrdinalIgnoreCase)
                || path.StartsWithSegments("/api/Auth", StringComparison.OrdinalIgnoreCase)
                || path.StartsWithSegments("/swagger", StringComparison.OrdinalIgnoreCase);
        }
    }
}
