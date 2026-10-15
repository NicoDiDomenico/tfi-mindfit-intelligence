using Microsoft.EntityFrameworkCore;
using MindFit_Intelligence_Backend.Models;
using MindFit_Intelligence_Backend.Repository.Interfaces;

namespace MindFit_Intelligence_Backend.Repository
{
    public class RangoHorarioRepository : IRangoHorarioRepository
    {
        private readonly MindFitIntelligenceContext _context;

        public RangoHorarioRepository(MindFitIntelligenceContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<RangoHorario>> Get()
        {
            return await _context.RangosHorarios
                .AsNoTracking()
                .OrderBy(rh => rh.HoraDesde)
                .ToListAsync();
        }

        public async Task<RangoHorario?> GetById(int id)
        {
            return await _context.RangosHorarios
                .AsNoTracking()
                .FirstOrDefaultAsync(rh => rh.IdRangoHorario == id);
        }

        public Task Add(RangoHorario entity)
        {
            throw new NotImplementedException();
        }

        public void Delete(RangoHorario entity)
        {
            throw new NotImplementedException();
        }

        public Task Save()
        {
            throw new NotImplementedException();
        }

        public void Update(RangoHorario entity)
        {
            throw new NotImplementedException();
        }
    }
}
