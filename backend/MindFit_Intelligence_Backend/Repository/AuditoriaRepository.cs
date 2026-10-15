using Microsoft.EntityFrameworkCore;
using MindFit_Intelligence_Backend.DTOs.Auditoria;
using MindFit_Intelligence_Backend.Models;
using MindFit_Intelligence_Backend.Repository.Interfaces;

namespace MindFit_Intelligence_Backend.Repository
{
    public class AuditoriaRepository : IAuditoriaRepository
    {
        private readonly MindFitIntelligenceContext _context;

        public AuditoriaRepository(MindFitIntelligenceContext context)
        {
            _context = context;
        }

        public async Task AddEventoAsync(AuditoriaEvento evento)
            => await _context.AuditoriaEventos.AddAsync(evento);

        public async Task AddSesionAsync(AuditoriaSesion sesion)
            => await _context.AuditoriaSesiones.AddAsync(sesion);

        public async Task SaveAsync()
            => await _context.SaveChangesAsync();

        public async Task<(List<AuditoriaEvento> Items, int Total)> GetEventosAsync(AuditoriaEventoFiltroDto filtro)
        {
            IQueryable<AuditoriaEvento> query = ApplyEventoFilters(_context.AuditoriaEventos.AsNoTracking(), filtro);

            int total = await query.CountAsync();
            var items = await query
                .OrderByDescending(e => e.FechaHoraUtc)
                .Skip(GetSkip(filtro.Pagina, filtro.TamanoPagina))
                .Take(GetTake(filtro.TamanoPagina))
                .ToListAsync();

            return (items, total);
        }

        public async Task<AuditoriaEvento?> GetEventoByIdAsync(int idAuditoriaEvento)
        {
            return await _context.AuditoriaEventos
                .AsNoTracking()
                .FirstOrDefaultAsync(e => e.IdAuditoriaEvento == idAuditoriaEvento);
        }

        public async Task<(List<AuditoriaSesion> Items, int Total)> GetSesionesAsync(AuditoriaSesionFiltroDto filtro)
        {
            IQueryable<AuditoriaSesion> query = ApplySesionFilters(_context.AuditoriaSesiones.AsNoTracking(), filtro);

            int total = await query.CountAsync();
            var items = await query
                .OrderByDescending(s => s.FechaHoraUtc)
                .Skip(GetSkip(filtro.Pagina, filtro.TamanoPagina))
                .Take(GetTake(filtro.TamanoPagina))
                .ToListAsync();

            return (items, total);
        }

        public async Task<int> CountEventosAsync(DateTime? fechaDesde, DateTime? fechaHasta)
        {
            var filtro = new AuditoriaEventoFiltroDto { FechaDesde = fechaDesde, FechaHasta = fechaHasta };
            return await ApplyEventoFilters(_context.AuditoriaEventos.AsNoTracking(), filtro).CountAsync();
        }

        public async Task<int> CountSesionesAsync(DateTime? fechaDesde, DateTime? fechaHasta)
        {
            var filtro = new AuditoriaSesionFiltroDto { FechaDesde = fechaDesde, FechaHasta = fechaHasta };
            return await ApplySesionFilters(_context.AuditoriaSesiones.AsNoTracking(), filtro).CountAsync();
        }

        public async Task<List<AuditoriaResumenItemDto>> GetEventosPorAccionAsync(DateTime? fechaDesde, DateTime? fechaHasta)
        {
            var filtro = new AuditoriaEventoFiltroDto { FechaDesde = fechaDesde, FechaHasta = fechaHasta };
            return await ApplyEventoFilters(_context.AuditoriaEventos.AsNoTracking(), filtro)
                .GroupBy(e => e.Accion)
                .Select(g => new AuditoriaResumenItemDto { Clave = g.Key, Total = g.Count() })
                .OrderByDescending(i => i.Total)
                .ToListAsync();
        }

        public async Task<List<AuditoriaResumenItemDto>> GetSesionesPorTipoAsync(DateTime? fechaDesde, DateTime? fechaHasta)
        {
            var filtro = new AuditoriaSesionFiltroDto { FechaDesde = fechaDesde, FechaHasta = fechaHasta };
            return await ApplySesionFilters(_context.AuditoriaSesiones.AsNoTracking(), filtro)
                .GroupBy(s => s.TipoEvento)
                .Select(g => new AuditoriaResumenItemDto { Clave = g.Key, Total = g.Count() })
                .OrderByDescending(i => i.Total)
                .ToListAsync();
        }

        private static IQueryable<AuditoriaEvento> ApplyEventoFilters(
            IQueryable<AuditoriaEvento> query,
            AuditoriaEventoFiltroDto filtro)
        {
            if (filtro.FechaDesde.HasValue)
                query = query.Where(e => e.FechaHoraUtc >= filtro.FechaDesde.Value);

            if (filtro.FechaHasta.HasValue)
                query = query.Where(e => e.FechaHoraUtc <= filtro.FechaHasta.Value);

            if (filtro.IdUsuario.HasValue)
                query = query.Where(e => e.IdUsuario == filtro.IdUsuario.Value);

            if (!string.IsNullOrWhiteSpace(filtro.Entidad))
                query = query.Where(e => e.Entidad == filtro.Entidad);

            if (filtro.IdEntidad.HasValue)
                query = query.Where(e => e.IdEntidad == filtro.IdEntidad.Value);

            if (!string.IsNullOrWhiteSpace(filtro.Accion))
                query = query.Where(e => e.Accion == filtro.Accion);

            if (!string.IsNullOrWhiteSpace(filtro.Resultado))
                query = query.Where(e => e.Resultado == filtro.Resultado);

            return query;
        }

        private static IQueryable<AuditoriaSesion> ApplySesionFilters(
            IQueryable<AuditoriaSesion> query,
            AuditoriaSesionFiltroDto filtro)
        {
            if (filtro.FechaDesde.HasValue)
                query = query.Where(s => s.FechaHoraUtc >= filtro.FechaDesde.Value);

            if (filtro.FechaHasta.HasValue)
                query = query.Where(s => s.FechaHoraUtc <= filtro.FechaHasta.Value);

            if (filtro.IdUsuario.HasValue)
                query = query.Where(s => s.IdUsuario == filtro.IdUsuario.Value);

            if (!string.IsNullOrWhiteSpace(filtro.UsernameIntentado))
                query = query.Where(s => s.UsernameIntentado != null && s.UsernameIntentado.Contains(filtro.UsernameIntentado));

            if (!string.IsNullOrWhiteSpace(filtro.TipoEvento))
                query = query.Where(s => s.TipoEvento == filtro.TipoEvento);

            if (!string.IsNullOrWhiteSpace(filtro.Resultado))
                query = query.Where(s => s.Resultado == filtro.Resultado);

            return query;
        }

        private static int GetSkip(int pagina, int tamanoPagina)
            => (Math.Max(pagina, 1) - 1) * GetTake(tamanoPagina);

        private static int GetTake(int tamanoPagina)
            => Math.Clamp(tamanoPagina, 1, 200);
    }
}
