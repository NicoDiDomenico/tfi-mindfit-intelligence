using Microsoft.EntityFrameworkCore;
using MindFit_Intelligence_Backend.Models;
using MindFit_Intelligence_Backend.Repository.Interfaces;

namespace MindFit_Intelligence_Backend.Repository
{
    public class MaquinaRepository : IMaquinaRepository
    {
        private readonly MindFitIntelligenceContext _context;

        public MaquinaRepository(MindFitIntelligenceContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<Maquina>> Get()
        {
            return await _context.Maquinas.AsNoTracking().ToListAsync();
        }

        public async Task<Maquina?> GetById(int id)
        {
            return await _context.Maquinas.FindAsync(id);
        }

        public async Task Add(Maquina entity)
        {
            await _context.Maquinas.AddAsync(entity);
        }

        public void Update(Maquina entity)
        {
            _context.Maquinas.Update(entity);
        }

        public void Delete(Maquina entity)
        {
            _context.Maquinas.Remove(entity);
        }

        public async Task Save()
        {
            await _context.SaveChangesAsync();
        }
    }
}