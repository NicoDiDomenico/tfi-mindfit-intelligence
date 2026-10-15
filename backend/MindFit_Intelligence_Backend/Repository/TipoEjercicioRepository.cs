using Microsoft.EntityFrameworkCore;
using MindFit_Intelligence_Backend.Models;
using MindFit_Intelligence_Backend.Repository.Interfaces;

namespace MindFit_Intelligence_Backend.Repository
{
    public class TipoEjercicioRepository : ITipoEjercicioRepository
    {
        private readonly MindFitIntelligenceContext _context;

        public TipoEjercicioRepository(MindFitIntelligenceContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<TipoEjercicio>> Get()
        {
            return await _context.TiposEjercicios
                .AsNoTracking()
                .ToListAsync();
        }

        public async Task<TipoEjercicio?> GetById(int id)
        {
            return await _context.TiposEjercicios
                .AsNoTracking()
                .FirstOrDefaultAsync(t => t.IdTipoEjercicio == id);
        }

        public Task Add(TipoEjercicio entity)
        {
            throw new NotImplementedException();
        }

        public void Delete(TipoEjercicio entity)
        {
            throw new NotImplementedException();
        }

        public Task Save()
        {
            throw new NotImplementedException();
        }

        public void Update(TipoEjercicio entity)
        {
            throw new NotImplementedException();
        }
    }
}
