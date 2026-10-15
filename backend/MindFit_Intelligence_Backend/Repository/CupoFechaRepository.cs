using Microsoft.EntityFrameworkCore;
using MindFit_Intelligence_Backend.Models;
using MindFit_Intelligence_Backend.Repository.Interfaces;

namespace MindFit_Intelligence_Backend.Repository
{
    public class CupoFechaRepository : ICupoFechaRepository
    {
        private readonly MindFitIntelligenceContext _context;

        public CupoFechaRepository(MindFitIntelligenceContext context)
        {
            _context = context;
        }

        public async Task<CupoFecha?> GetByDiaRangoHorarioYFecha(int idDiaRangoHorario, DateTime fecha)
        {
            return await _context.CupoFechas
                .Include(cf => cf.DiaRangoHorario)
                .FirstOrDefaultAsync(cf => cf.IdDiaRangoHorario == idDiaRangoHorario
                                        && cf.Fecha == fecha.Date);
        }

        public async Task Add(CupoFecha entity)
            => await _context.CupoFechas.AddAsync(entity);

        public void Update(CupoFecha entity)
        {
            _context.CupoFechas.Attach(entity);
            _context.Entry(entity).State = EntityState.Modified;
        }

        public async Task Save()
            => await _context.SaveChangesAsync();
    }
}
