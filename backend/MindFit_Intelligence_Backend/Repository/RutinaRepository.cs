using Microsoft.EntityFrameworkCore;
using MindFit_Intelligence_Backend.Models;
using MindFit_Intelligence_Backend.Repository.Interfaces;
using MindFit_Intelligence_Backend.Services.Auditoria;
using MindFit_Intelligence_Backend.Services.Interfaces;

namespace MindFit_Intelligence_Backend.Repository
{
    public class RutinaRepository : IRutinaRepository
    {
        private readonly MindFitIntelligenceContext _context;
        private readonly IAuditoriaService _auditoriaService;
        private readonly ICurrentUserService _currentUserService;

        public RutinaRepository(
            MindFitIntelligenceContext context,
            IAuditoriaService auditoriaService,
            ICurrentUserService currentUserService)
        {
            _context = context;
            _auditoriaService = auditoriaService;
            _currentUserService = currentUserService;
        }

        public async Task<Rutina?> GetRutinaPorSocioYDia(int idUsuarioSocio, int? idDia, string? nombreDia)
        {
            return await QueryRutinaCompleta()
                .Where(r => r.IdPersonaSocio == idUsuarioSocio
                            && r.Activo
                            && (idDia.HasValue
                                ? r.IdDia == idDia.Value
                                : r.Dia.NombreDia == nombreDia))
                .FirstOrDefaultAsync();
        }

        public async Task<Rutina?> ReemplazarBloquesRutina(int idRutina, List<Calentamiento> calentamientos, List<Entrenamiento> entrenamientos, List<Estiramiento> estiramientos)
        {
            await using var transaction = await _context.Database.BeginTransactionAsync();

            var rutina = await _context.Rutinas
                .Include(r => r.Calentamientos)
                .Include(r => r.Entrenamientos)
                .Include(r => r.Estiramientos)
                .FirstOrDefaultAsync(r => r.IdRutina == idRutina && r.Activo);

            if (rutina == null)
            {
                return null;
            }

            var snapshotOriginal = _auditoriaService.CrearSnapshotRutina(rutina);
            var historial = await GuardarSnapshotRutina(rutina, "RutinaBloquesModificados");

            await _context.Calentamientos
                .Where(c => c.IdRutina == idRutina)
                .ExecuteDeleteAsync();

            await _context.Entrenamientos
                .Where(e => e.IdRutina == idRutina)
                .ExecuteDeleteAsync();

            await _context.Estiramientos
                .Where(e => e.IdRutina == idRutina)
                .ExecuteDeleteAsync();

            if (calentamientos.Count > 0)
            {
                foreach (var calentamiento in calentamientos)
                {
                    calentamiento.IdRutina = idRutina;
                }

                await _context.Calentamientos.AddRangeAsync(calentamientos);
            }

            if (entrenamientos.Count > 0)
            {
                foreach (var entrenamiento in entrenamientos)
                {
                    entrenamiento.IdRutina = idRutina;
                }

                await _context.Entrenamientos.AddRangeAsync(entrenamientos);
            }

            if (estiramientos.Count > 0)
            {
                foreach (var estiramiento in estiramientos)
                {
                    estiramiento.IdRutina = idRutina;
                }

                await _context.Estiramientos.AddRangeAsync(estiramientos);
            }

            rutina.FechaModificacion = DateTime.Now;

            await _context.SaveChangesAsync();

            var rutinaActualizadaParaAuditoria = await QueryRutinaCompleta()
                .FirstOrDefaultAsync(r => r.IdRutina == idRutina && r.Activo);
            var snapshotNuevo = _auditoriaService.CrearSnapshotRutina(rutinaActualizadaParaAuditoria);
            CompletarSnapshotAuditoria(historial, snapshotOriginal, snapshotNuevo);
            await _auditoriaService.RegistrarEventoRutinaAsync(
                idRutina,
                "RutinaBloquesModificados",
                snapshotOriginal,
                snapshotNuevo);

            await transaction.CommitAsync();

            return rutinaActualizadaParaAuditoria;
        }

        public async Task<Rutina?> CambiarEstadoRutina(int idRutina, bool activo)
        {
            await using var transaction = await _context.Database.BeginTransactionAsync();

            var rutina = await _context.Rutinas
                .Include(r => r.Calentamientos)
                .Include(r => r.Entrenamientos)
                .Include(r => r.Estiramientos)
                .FirstOrDefaultAsync(r => r.IdRutina == idRutina);
            if (rutina == null)
            {
                return null;
            }

            var snapshotOriginal = _auditoriaService.CrearSnapshotRutina(rutina);
            var accion = activo ? "RutinaReactivada" : "RutinaDesactivada";
            var historial = await GuardarSnapshotRutina(rutina, accion);

            rutina.Activo = activo;
            rutina.FechaModificacion = DateTime.Now;

            await _context.SaveChangesAsync();

            var rutinaActualizada = await QueryRutinaCompleta()
                .FirstOrDefaultAsync(r => r.IdRutina == idRutina);
            var snapshotNuevo = _auditoriaService.CrearSnapshotRutina(rutinaActualizada);
            CompletarSnapshotAuditoria(historial, snapshotOriginal, snapshotNuevo);
            await _auditoriaService.RegistrarEventoRutinaAsync(
                idRutina,
                accion,
                snapshotOriginal,
                snapshotNuevo);

            await transaction.CommitAsync();

            return rutinaActualizada;
        }

        public async Task<List<RutinaHistorial>> GetHistorialByRutina(int idRutina)
        {
            return await _context.RutinasHistorial
                .AsNoTracking()
                .Where(h => h.IdRutina == idRutina)
                .OrderByDescending(h => h.Version)
                .ToListAsync();
        }

        public async Task<RutinaHistorial?> GetHistorialDetalle(int idRutina, int idRutinaHistorial)
        {
            return await _context.RutinasHistorial
                .AsNoTracking()
                .Include(h => h.Calentamientos)
                .Include(h => h.Entrenamientos)
                .Include(h => h.Estiramientos)
                .FirstOrDefaultAsync(h => h.IdRutina == idRutina && h.IdRutinaHistorial == idRutinaHistorial);
        }

        public async Task<Rutina?> RestaurarRutinaDesdeHistorial(int idRutina, int idRutinaHistorial)
        {
            var historial = await _context.RutinasHistorial
                .AsNoTracking()
                .Include(h => h.Calentamientos)
                .Include(h => h.Entrenamientos)
                .Include(h => h.Estiramientos)
                .FirstOrDefaultAsync(h => h.IdRutina == idRutina && h.IdRutinaHistorial == idRutinaHistorial);

            if (historial == null)
            {
                return null;
            }

            var rutina = await _context.Rutinas
                .Include(r => r.Calentamientos)
                .Include(r => r.Entrenamientos)
                .Include(r => r.Estiramientos)
                .FirstOrDefaultAsync(r => r.IdRutina == idRutina);
            if (rutina == null)
            {
                return null;
            }

            await using var transaction = await _context.Database.BeginTransactionAsync();
            var snapshotOriginal = _auditoriaService.CrearSnapshotRutina(rutina);
            var historialAuditoria = await GuardarSnapshotRutina(rutina, "RutinaRestaurada");

            await _context.Calentamientos
                .Where(c => c.IdRutina == idRutina)
                .ExecuteDeleteAsync();

            await _context.Entrenamientos
                .Where(e => e.IdRutina == idRutina)
                .ExecuteDeleteAsync();

            await _context.Estiramientos
                .Where(e => e.IdRutina == idRutina)
                .ExecuteDeleteAsync();

            if (historial.Calentamientos.Count > 0)
            {
                var calentamientos = historial.Calentamientos.Select(c => new Calentamiento
                {
                    IdRutina = idRutina,
                    IdEjercicio = c.IdEjercicio,
                    Duracion = c.Duracion,
                    Orden = c.Orden,
                    Observaciones = c.Observaciones
                });

                await _context.Calentamientos.AddRangeAsync(calentamientos);
            }

            if (historial.Entrenamientos.Count > 0)
            {
                var entrenamientos = historial.Entrenamientos.Select(e => new Entrenamiento
                {
                    IdRutina = idRutina,
                    IdEjercicio = e.IdEjercicio,
                    Series = e.Series,
                    Repeticiones = e.Repeticiones,
                    PesoAsignado = e.PesoAsignado,
                    TiempoDescansoSegundos = e.TiempoDescansoSegundos,
                    Orden = e.Orden,
                    Observaciones = e.Observaciones
                });

                await _context.Entrenamientos.AddRangeAsync(entrenamientos);
            }

            if (historial.Estiramientos.Count > 0)
            {
                var estiramientos = historial.Estiramientos.Select(e => new Estiramiento
                {
                    IdRutina = idRutina,
                    IdEjercicio = e.IdEjercicio,
                    Duracion = e.Duracion,
                    Orden = e.Orden,
                    Observaciones = e.Observaciones
                });

                await _context.Estiramientos.AddRangeAsync(estiramientos);
            }

            rutina.Activo = historial.ActivoSnapshot;
            rutina.FechaModificacion = DateTime.Now;

            await _context.SaveChangesAsync();

            var rutinaActualizada = await QueryRutinaCompleta()
                .FirstOrDefaultAsync(r => r.IdRutina == idRutina);
            var snapshotNuevo = _auditoriaService.CrearSnapshotRutina(rutinaActualizada);
            CompletarSnapshotAuditoria(historialAuditoria, snapshotOriginal, snapshotNuevo);
            await _auditoriaService.RegistrarEventoRutinaAsync(
                idRutina,
                "RutinaRestaurada",
                snapshotOriginal,
                snapshotNuevo,
                mensaje: $"Restaurada desde version {historial.Version}");

            await transaction.CommitAsync();

            return rutinaActualizada;
        }

        private async Task<RutinaHistorial> GuardarSnapshotRutina(Rutina rutina, string accion)
        {
            int versionActual = await _context.RutinasHistorial
                .Where(h => h.IdRutina == rutina.IdRutina)
                .Select(h => (int?)h.Version)
                .MaxAsync() ?? 0;

            var historial = new RutinaHistorial
            {
                IdRutina = rutina.IdRutina,
                Version = versionActual + 1,
                FechaSnapshot = DateTime.Now,
                ActivoSnapshot = rutina.Activo,
                IdUsuarioAccion = _currentUserService.IdUsuario,
                Accion = accion,
                FechaAccionUtc = DateTime.UtcNow,
                Calentamientos = rutina.Calentamientos
                    .Select(c => new RutinaHistorialCalentamiento
                    {
                        IdEjercicio = c.IdEjercicio,
                        Duracion = c.Duracion,
                        Orden = c.Orden,
                        Observaciones = c.Observaciones
                    })
                    .ToList(),
                Entrenamientos = rutina.Entrenamientos
                    .Select(e => new RutinaHistorialEntrenamiento
                    {
                        IdEjercicio = e.IdEjercicio,
                        Series = e.Series,
                        Repeticiones = e.Repeticiones,
                        PesoAsignado = e.PesoAsignado,
                        TiempoDescansoSegundos = e.TiempoDescansoSegundos,
                        Orden = e.Orden,
                        Observaciones = e.Observaciones
                    })
                    .ToList(),
                Estiramientos = rutina.Estiramientos
                    .Select(e => new RutinaHistorialEstiramiento
                    {
                        IdEjercicio = e.IdEjercicio,
                        Duracion = e.Duracion,
                        Orden = e.Orden,
                        Observaciones = e.Observaciones
                    })
                    .ToList()
            };

            await _context.RutinasHistorial.AddAsync(historial);
            return historial;
        }

        private void CompletarSnapshotAuditoria(
            RutinaHistorial historial,
            RutinaAuditoriaSnapshot? snapshotOriginal,
            RutinaAuditoriaSnapshot? snapshotNuevo)
        {
            historial.ValoresNuevosJson = _auditoriaService.SerializarSnapshot(snapshotNuevo);
            historial.CambiosJson = _auditoriaService.CrearCambiosRutinaJson(snapshotOriginal, snapshotNuevo);
        }

        private IQueryable<Rutina> QueryRutinaCompleta()
        {
            return _context.Rutinas
                .AsNoTracking()
                .AsSplitQuery()
                .Include(r => r.Calentamientos)
                    .ThenInclude(c => c.Ejercicio)
                        .ThenInclude(e => e.GrupoMuscular)
                .Include(r => r.Calentamientos)
                    .ThenInclude(c => c.Ejercicio)
                        .ThenInclude(e => e.TipoEjercicio)
                .Include(r => r.Calentamientos)
                    .ThenInclude(c => c.Ejercicio)
                        .ThenInclude(e => e.Maquina)
                .Include(r => r.Calentamientos)
                    .ThenInclude(c => c.Ejercicio)
                        .ThenInclude(e => e.Equipamiento)

                .Include(r => r.Entrenamientos)
                    .ThenInclude(e => e.Ejercicio)
                        .ThenInclude(e => e.GrupoMuscular)
                .Include(r => r.Entrenamientos)
                    .ThenInclude(e => e.Ejercicio)
                        .ThenInclude(e => e.TipoEjercicio)
                .Include(r => r.Entrenamientos)
                    .ThenInclude(e => e.Ejercicio)
                        .ThenInclude(e => e.Maquina)
                .Include(r => r.Entrenamientos)
                    .ThenInclude(e => e.Ejercicio)
                        .ThenInclude(e => e.Equipamiento)

                .Include(r => r.Estiramientos)
                    .ThenInclude(e => e.Ejercicio)
                        .ThenInclude(e => e.GrupoMuscular)
                .Include(r => r.Estiramientos)
                    .ThenInclude(e => e.Ejercicio)
                        .ThenInclude(e => e.TipoEjercicio)
                .Include(r => r.Estiramientos)
                    .ThenInclude(e => e.Ejercicio)
                        .ThenInclude(e => e.Maquina)
                .Include(r => r.Estiramientos)
                    .ThenInclude(e => e.Ejercicio)
                        .ThenInclude(e => e.Equipamiento);
        }
    }
}
