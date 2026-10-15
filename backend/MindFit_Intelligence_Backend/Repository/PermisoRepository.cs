using Microsoft.EntityFrameworkCore;
using MindFit_Intelligence_Backend.Models;
using MindFit_Intelligence_Backend.Repository.Interfaces;

namespace MindFit_Intelligence_Backend.Repository
{
    public class PermisoRepository : IPermisoRepository
    {
        private readonly MindFitIntelligenceContext _context;
        public PermisoRepository(MindFitIntelligenceContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<Permiso>> Get()
        {
            return await _context.Permisos
                .AsNoTracking()
                .ToListAsync();
        }
    }
}
