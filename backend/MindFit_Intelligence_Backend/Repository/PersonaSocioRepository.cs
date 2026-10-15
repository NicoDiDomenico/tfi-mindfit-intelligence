using Microsoft.EntityFrameworkCore;
using MindFit_Intelligence_Backend.Models;
using MindFit_Intelligence_Backend.Models.Enums;
using MindFit_Intelligence_Backend.Repository.Interfaces;

namespace MindFit_Intelligence_Backend.Repository
{
    public class PersonaSocioRepository : IPersonaSocioRepository
    {
        private MindFitIntelligenceContext _context;
        public PersonaSocioRepository(MindFitIntelligenceContext context)
        {
            _context = context;
        }

        public async Task<PersonaSocio?> GetById(int id)
        {
            PersonaSocio? personaSocio = await _context.PersonaSocios
                .Include(ps => ps.PerfilIA)
                .Include(ps => ps.Rutinas)
                .Include(ps => ps.Cuotas.OrderByDescending(c => c.FechaFinPeriodo))
                .FirstOrDefaultAsync(ps => ps.IdUsuario == id);
            return personaSocio;
        }

        public async Task<PersonaSocio?> GetByEmail(string email)
        {
            return await _context.PersonaSocios
                .FirstOrDefaultAsync(p => p.Email == email);
        }

        public async Task<List<PersonaSocio>> GetSociosSuspendidos()
        {
            return await _context.PersonaSocios
                .Where(ps => ps.EstadoSocio == EstadoSocio.Supendido)
                .ToListAsync();
        }
    }
}
