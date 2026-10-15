using Microsoft.EntityFrameworkCore;
using MindFit_Intelligence_Backend.Models;
using MindFit_Intelligence_Backend.Repository.Interfaces;

namespace MindFit_Intelligence_Backend.Repository
{
    public class EjercicioRepository : IEjercicioRepository
    {
        private readonly MindFitIntelligenceContext _context;

        public EjercicioRepository(MindFitIntelligenceContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<Ejercicio>> Get()
        {
            return await _context.Ejercicios
                .AsNoTracking()
                .Include(e => e.GrupoMuscular)
                .Include(e => e.TipoEjercicio)
                .Include(e => e.Maquina)
                .Include(e => e.Equipamiento)
                .ToListAsync();
        }

        public async Task<Ejercicio?> GetById(int id)
        {
            return await _context.Ejercicios
                .Include(e => e.GrupoMuscular)
                .Include(e => e.TipoEjercicio)
                .Include(e => e.Maquina)
                .Include(e => e.Equipamiento)
                .FirstOrDefaultAsync(e => e.IdEjercicio == id);
        }

        public async Task<IEnumerable<Ejercicio>> GetByGrupoMuscularId(int idGrupoMuscular)
        {
            return await _context.Ejercicios
                .AsNoTracking()
                .Include(e => e.GrupoMuscular)
                .Include(e => e.TipoEjercicio)
                .Include(e => e.Maquina)
                .Include(e => e.Equipamiento)
                .Where(e => e.IdGrupoMuscular == idGrupoMuscular)
                .ToListAsync();
        }

        public async Task Add(Ejercicio entity)
        {
            await _context.Ejercicios.AddAsync(entity);
        }

        // Usar Update solo si se que el dto trae todos los campos, si no, usar GetById (trackeada) para traer la entidad, mapearla y usar save.
        public void Update(Ejercicio entity)
        {
            _context.Ejercicios.Update(entity);
        }

        public void Delete(Ejercicio entity)
        {
            _context.Ejercicios.Remove(entity);
        }

        public async Task Save()
        {
            await _context.SaveChangesAsync();
        }
    }
}