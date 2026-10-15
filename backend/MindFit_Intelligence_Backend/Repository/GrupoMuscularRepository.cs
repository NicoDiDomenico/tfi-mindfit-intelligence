using Microsoft.EntityFrameworkCore;
using MindFit_Intelligence_Backend.Models;
using MindFit_Intelligence_Backend.Repository.Interfaces;

namespace MindFit_Intelligence_Backend.Repository
{
    public class GrupoMuscularRepository : IGrupoMuscularRepository
    {
        private readonly MindFitIntelligenceContext _context;

        public GrupoMuscularRepository(MindFitIntelligenceContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<GrupoMuscular>> Get()
        {
            return await _context.GruposMusculares
                .AsNoTracking()
                .ToListAsync();
        }

        public async Task<GrupoMuscular?> GetById(int id)
        {
            return await _context.GruposMusculares
                .AsNoTracking()
                .FirstOrDefaultAsync(g => g.IdGrupoMuscular == id);
        }

        public Task Add(GrupoMuscular entity)
        {
            throw new NotImplementedException();
        }

        public void Delete(GrupoMuscular entity)
        {
            throw new NotImplementedException();
        }

        public Task Save()
        {
            throw new NotImplementedException();
        }

        public void Update(GrupoMuscular entity)
        {
            throw new NotImplementedException();
        }
    }
}
