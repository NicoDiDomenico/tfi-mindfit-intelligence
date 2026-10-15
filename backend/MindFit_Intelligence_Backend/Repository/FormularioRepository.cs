using Microsoft.EntityFrameworkCore;
using MindFit_Intelligence_Backend.Models;
using MindFit_Intelligence_Backend.Repository.Interfaces;

namespace MindFit_Intelligence_Backend.Repository
{
    public class FormularioRepository : IFormularioRepository
    {
        private readonly MindFitIntelligenceContext _context;

        public FormularioRepository(MindFitIntelligenceContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<Formulario>> GetConPermisos()
        {
            return await _context.Formularios
                .AsNoTracking()
                .Include(f => f.FormularioPermisos)
                    .ThenInclude(fp => fp.Permiso)
                .ToListAsync();
        }
    }
}
