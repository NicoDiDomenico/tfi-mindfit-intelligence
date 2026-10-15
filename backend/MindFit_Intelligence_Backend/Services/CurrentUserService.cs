using MindFit_Intelligence_Backend.Services.Interfaces;
using System.Security.Claims;

namespace MindFit_Intelligence_Backend.Services
{
    public class CurrentUserService : ICurrentUserService
    {
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly ITenantContext _tenantContext;

        public CurrentUserService(IHttpContextAccessor httpContextAccessor, ITenantContext tenantContext)
        {
            _httpContextAccessor = httpContextAccessor;
            _tenantContext = tenantContext;
        }

        public int? IdUsuario
        {
            get
            {
                string? value = _httpContextAccessor.HttpContext?.User
                    .FindFirst(ClaimTypes.NameIdentifier)?.Value;

                return int.TryParse(value, out int idUsuario) ? idUsuario : null;
            }
        }

        public string? Username => _httpContextAccessor.HttpContext?.User
            .FindFirst(ClaimTypes.Name)?.Value;

        public int? IdGimnasio
        {
            get
            {
                if (_tenantContext.IdGimnasio.HasValue)
                    return _tenantContext.IdGimnasio.Value;

                string? claimValue = _httpContextAccessor.HttpContext?.User
                    .FindFirst("IdGimnasio")?.Value;

                return int.TryParse(claimValue, out int idGimnasio) ? idGimnasio : null;
            }
        }

        public string? IpAddress => _httpContextAccessor.HttpContext?.Connection.RemoteIpAddress?.ToString();

        public string? UserAgent => _httpContextAccessor.HttpContext?.Request.Headers.UserAgent.ToString();

        public string? Endpoint => _httpContextAccessor.HttpContext?.Request.Path.Value;

        public string? MetodoHttp => _httpContextAccessor.HttpContext?.Request.Method;
    }
}
