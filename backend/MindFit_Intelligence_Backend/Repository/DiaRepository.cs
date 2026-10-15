using Microsoft.EntityFrameworkCore;
using MindFit_Intelligence_Backend.Models;
using MindFit_Intelligence_Backend.Repository.Interfaces;

namespace MindFit_Intelligence_Backend.Repository
{
    public class DiaRepository : IDiaRepository
   {
        private MindFitIntelligenceContext _context;

        public DiaRepository(MindFitIntelligenceContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<Dia>> GetAll()
        {
            return await _context.Dias
                .OrderBy(d => d.IdDia)
                .ToListAsync();
        }
    }
}