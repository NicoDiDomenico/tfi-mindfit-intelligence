using Microsoft.EntityFrameworkCore;
using MindFit_Intelligence_Backend.DTOs.Turno;
using MindFit_Intelligence_Backend.Models;
using MindFit_Intelligence_Backend.Models.Enums;
using MindFit_Intelligence_Backend.Repository.Interfaces;

namespace MindFit_Intelligence_Backend.Repository
{
    public class TurnoRepository : ITurnoRepository
    {
        private readonly MindFitIntelligenceContext _context;

        public TurnoRepository(MindFitIntelligenceContext context)
        {
            _context = context;
        }

        public async Task<bool> ExisteTurnoEnFecha(int idSocio, DateTime fecha)
        {
            return await _context.Turnos
                .AnyAsync(t => t.IdUsuarioSocio == idSocio
                            && t.CupoFecha.Fecha == fecha.Date);
        }

        public async Task<IEnumerable<Turno>> GetSociosConTurnoHoyPorEntrenadorYHorario(int idUsuarioResponsable, int idRangoHorario, DateTime fechaActual)
        {
            return await _context.Turnos
                .AsNoTracking()
                .Include(t => t.PersonaSocio)
                .Where(t => t.IdUsuarioResponsable == idUsuarioResponsable
                            && t.CupoFecha.Fecha == fechaActual
                            && t.CupoFecha.DiaRangoHorario.IdRangoHorario == idRangoHorario
                            && t.EstadoTurno == EstadoTurno.EnCurso)
                .ToListAsync();
        }

        public async Task<IEnumerable<Turno>> GetByIdUsuarioSocio(int idUsuarioSocio)
        {
            return await _context.Turnos
                .Include(t => t.PersonaResponsable)
                .Include(t => t.CupoFecha)
                    .ThenInclude(cf => cf.DiaRangoHorario)
                        .ThenInclude(drh => drh.RangoHorario)
                .Include(t => t.CupoFecha)
                    .ThenInclude(cf => cf.DiaRangoHorario)
                        .ThenInclude(drh => drh.Dia)
                .Include(t => t.PersonaSocio)
                .Where(t => t.IdUsuarioSocio == idUsuarioSocio)
                .ToListAsync();
        }

        public async Task<Turno?> GetByIdWithIncludes(int idTurno)
        {
            return await _context.Turnos
                .Include(t => t.PersonaResponsable)
                .Include(t => t.PersonaSocio)
                .Include(t => t.CupoFecha)
                    .ThenInclude(cf => cf.DiaRangoHorario)
                        .ThenInclude(drh => drh.RangoHorario)
                .Include(t => t.CupoFecha)
                    .ThenInclude(cf => cf.DiaRangoHorario)
                        .ThenInclude(drh => drh.Dia)
                .FirstOrDefaultAsync(t => t.IdTurno == idTurno);
        }

        public async Task<Turno?> GetTurnoParaIngresoByDniAsync(string dniSocio, DateTime fecha)
        {
            return await _context.Turnos
                .Include(t => t.PersonaSocio)
                .Include(t => t.CupoFecha)
                .Where(t => t.PersonaSocio.NroDocumento == dniSocio
                         && t.CupoFecha.Fecha == fecha.Date
                         && (t.EstadoTurno == Models.Enums.EstadoTurno.EnCurso))
                .FirstOrDefaultAsync();
        }

        public async Task Add(Turno entity)
            => await _context.Turnos.AddAsync(entity);

        public async Task<IEnumerable<TurnoDetalleDto>> GetTurnosDetallePorFechaAsync(DateTime fechaFiltro)
        {
            // PASO 1: Consulta a la Base de Datos (SQL Puro)
            var turnosCrudos = await _context.Turnos
                .AsNoTracking()
                .Where(t => t.CupoFecha.Fecha == fechaFiltro.Date)
                .Select(t => new
                {
                    t.IdTurno,
                    NombreDia = t.CupoFecha.DiaRangoHorario.Dia.NombreDia,
                    t.CupoFecha.Fecha,
                    t.CupoFecha.CupoActual,
                    t.CupoFecha.DiaRangoHorario.CupoMaximo,
                    t.CupoFecha.DiaRangoHorario.RangoHorario.HoraDesde,
                    NombreResponsable = t.PersonaResponsable.Nombre,
                    ApellidoResponsable = t.PersonaResponsable.Apellido,
                    NombreSocio = t.PersonaSocio.Nombre,
                    ApellidoSocio = t.PersonaSocio.Apellido,
                    t.EstadoTurno
                })
                .ToListAsync();

            // PASO 2: Formateo en Memoria (C# Puro)
            var resultado = turnosCrudos.Select(t => new TurnoDetalleDto
            {
                IdTurno = t.IdTurno,
                NombreDia = t.NombreDia,
                Fecha = t.Fecha,
                Cupos = $"{t.CupoActual}/{t.CupoMaximo}",
                Hora = t.HoraDesde.ToString(@"hh\:mm"),
                Entrenador = $"{t.NombreResponsable} {t.ApellidoResponsable}",
                Socio = $"{t.NombreSocio} {t.ApellidoSocio}",
                EstadoTurno = t.EstadoTurno.ToString()
            });

            return resultado;
        }

        public async Task<List<Turno>> GetTurnosEnCurso()
        {
            return await _context.Turnos
                .Include(t => t.CupoFecha)
                .Where(t => t.EstadoTurno == Models.Enums.EstadoTurno.EnCurso)
                .ToListAsync();
        }

        public async Task Save()
            => await _context.SaveChangesAsync();
    }
}
