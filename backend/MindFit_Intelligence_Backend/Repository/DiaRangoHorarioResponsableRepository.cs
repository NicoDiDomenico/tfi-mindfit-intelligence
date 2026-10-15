using Microsoft.EntityFrameworkCore;
using MindFit_Intelligence_Backend.Models;
using MindFit_Intelligence_Backend.Repository.Interfaces;

namespace MindFit_Intelligence_Backend.Repository
{
    public class DiaRangoHorarioResponsableRepository : IDiaRangoHorarioResponsableRepository
    {
        private readonly MindFitIntelligenceContext _context;

        public DiaRangoHorarioResponsableRepository(MindFitIntelligenceContext context)
        {
            _context = context;
        }

        public async Task<DiaRangoHorarioResponsable?> GetByIds(int idDiaRangoHorario, int idUsuarioResponsable)
        {
            return await _context.DiaRangosHorariosResponsables
                .FirstOrDefaultAsync(r => r.IdDiaRangoHorario == idDiaRangoHorario && r.IdUsuarioResponsable == idUsuarioResponsable);
        }

        public async Task Add(DiaRangoHorarioResponsable responsable)
            => await _context.DiaRangosHorariosResponsables.AddAsync(responsable);

        public Task Remove(DiaRangoHorarioResponsable responsable)
        {
            _context.DiaRangosHorariosResponsables.Remove(responsable);
            return Task.CompletedTask;
        }

        public async Task Save()
            => await _context.SaveChangesAsync();
    }
}
