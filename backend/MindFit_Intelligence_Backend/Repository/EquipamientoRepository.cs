using Microsoft.EntityFrameworkCore;
using MindFit_Intelligence_Backend.Models;
using MindFit_Intelligence_Backend.Repository.Interfaces;

namespace MindFit_Intelligence_Backend.Repository
{
    public class EquipamientoRepository : IEquipamientoRepository
    {
        private readonly MindFitIntelligenceContext _context;

        public EquipamientoRepository(MindFitIntelligenceContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<Equipamiento>> Get()
        {
            return await _context.Equipamientos.AsNoTracking().ToListAsync();
        }

        public async Task<Equipamiento?> GetById(int id)
        {
            return await _context.Equipamientos.FindAsync(id);
        }

        public async Task Add(Equipamiento entity)
        {
            await _context.Equipamientos.AddAsync(entity);
        }

        public void Update(Equipamiento entity)
        {
            _context.Equipamientos.Update(entity);
        }

        public void Delete(Equipamiento entity)
        {
            _context.Equipamientos.Remove(entity);
        }

        public async Task Save()
        {
            await _context.SaveChangesAsync();
        }
    }
}