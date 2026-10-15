using Microsoft.EntityFrameworkCore;
using MindFit_Intelligence_Backend.Models;
using MindFit_Intelligence_Backend.Models.Enums;
using MindFit_Intelligence_Backend.Repository.Interfaces;

namespace MindFit_Intelligence_Backend.Repository
{
    public class CuotaRepository : ICuotaRepository
    {
        private readonly MindFitIntelligenceContext _context;

        public CuotaRepository(MindFitIntelligenceContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<Cuota>> GetBySocio(int idUsuario)
        {
            return await _context.Cuotas
                .AsNoTracking()
                .Where(c => c.IdUsuario == idUsuario)
                .OrderByDescending(c => c.FechaInicioPeriodo)
                .ToListAsync();
        }

        public async Task<Cuota?> GetUltimaCuotaSocio(int idUsuario)
        {
            return await _context.Cuotas
                .Where(c => c.IdUsuario == idUsuario)
                .OrderByDescending(c => c.FechaFinPeriodo)
                .FirstOrDefaultAsync();
        }

        public async Task<Cuota?> GetCuotaVigente(int idUsuario)
        {
            return await _context.Cuotas
                .Where(c => c.IdUsuario == idUsuario && c.EstadoCuota == EstadoCuota.Vigente)
                .OrderByDescending(c => c.FechaFinPeriodo)
                .FirstOrDefaultAsync();
        }

        public async Task<Cuota?> GetById(int id)
        {
            return await _context.Cuotas.FindAsync(id);
        }
        public async Task<IEnumerable<Cuota>> GetVencidas()
        {
            return await _context.Cuotas
                .Include(c => c.PersonaSocio)
                .Where(c => c.FechaFinPeriodo < DateTime.Now && c.EstadoCuota != EstadoCuota.Vencida)
                .ToListAsync();
        }
        public async Task Add(Cuota entity)
            => await _context.Cuotas.AddAsync(entity);

        public void Update(Cuota entity)
        {
            _context.Cuotas.Attach(entity);
            _context.Entry(entity).State = EntityState.Modified;
        }

        public void Delete(Cuota entity)
            => _context.Cuotas.Remove(entity);

        public async Task Save()
            => await _context.SaveChangesAsync();
    }
}
