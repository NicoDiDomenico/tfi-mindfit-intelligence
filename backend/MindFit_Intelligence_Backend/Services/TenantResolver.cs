using Microsoft.EntityFrameworkCore;
using MindFit_Intelligence_Backend.Services.Interfaces;
using MindFit_Intelligence_Backend.Models.Master;
using System.Threading.Tasks;

namespace MindFit_Intelligence_Backend.Services
{
    public class TenantResolver : ITenantResolver
    {
        private readonly MindFitMasterContext _masterContext;

        public TenantResolver(MindFitMasterContext masterContext)
        {
            _masterContext = masterContext;
        }

        public async Task<string?> ResolveConnectionStringAsync(int idGimnasio)
        {
            var gym = await _masterContext.Gyms
                .AsNoTracking()
                .FirstOrDefaultAsync(g => g.IdGym == idGimnasio && g.Activo);

            return gym?.ConnectionString;
        }
    }
}