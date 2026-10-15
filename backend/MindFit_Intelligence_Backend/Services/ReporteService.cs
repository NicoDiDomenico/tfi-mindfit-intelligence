using Microsoft.EntityFrameworkCore;
using MindFit_Intelligence_Backend.DTOs.Reportes;
using MindFit_Intelligence_Backend.Models;
using MindFit_Intelligence_Backend.Models.Enums;
using MindFit_Intelligence_Backend.Services.Interfaces;

namespace MindFit_Intelligence_Backend.Services
{
    public class ReporteService : IReporteService
    {
        private readonly MindFitIntelligenceContext _context;

        public ReporteService(MindFitIntelligenceContext context)
        {
            _context = context;
        }

        public async Task<ReportesGimnasioDto> GetReportesGimnasio(ReporteFiltroDto filtro)
        {
            var (fechaDesde, fechaHasta) = NormalizarRango(filtro);
            DateTime fechaHastaExclusiva = fechaHasta.AddDays(1);
            DateTime hoy = DateTime.Today;
            DateTime seguimientoDesde = hoy.AddDays(-29);
            DateTime seguimientoHasta = hoy;

            var ocupacion = await GetOcupacionHoraria(fechaDesde, fechaHastaExclusiva);
            var flujoReservasProfesor = await GetFlujoReservasProfesor(fechaDesde, fechaHastaExclusiva);
            var sociosSeguimiento = await GetSociosSeguimiento(seguimientoDesde, seguimientoHasta);
            var sociosRiesgo = sociosSeguimiento
                .Where(socio => socio.NivelRiesgo != "Bajo")
                .ToList();
            var ingresoCuotasMesActual = await GetIngresoCuotasMesActual(hoy);

            return new ReportesGimnasioDto
            {
                Resumen = CrearResumen(ocupacion, sociosRiesgo, ingresoCuotasMesActual),
                OcupacionHoraria = ocupacion,
                SociosRiesgo = sociosRiesgo,
                SociosSeguimiento = sociosSeguimiento,
                FlujoReservasProfesor = flujoReservasProfesor
            };
        }

        private async Task<List<OcupacionHorariaDto>> GetOcupacionHoraria(
            DateTime fechaDesde,
            DateTime fechaHastaExclusiva)
        {
            var cupos = await _context.CupoFechas
                .AsNoTracking()
                .Include(cf => cf.Turnos)
                .Include(cf => cf.DiaRangoHorario)
                    .ThenInclude(drh => drh.Dia)
                .Include(cf => cf.DiaRangoHorario)
                    .ThenInclude(drh => drh.RangoHorario)
                .Where(cf => cf.Fecha >= fechaDesde && cf.Fecha < fechaHastaExclusiva)
                .ToListAsync();

            return cupos
                .Where(cf => cf.DiaRangoHorario?.Dia != null && cf.DiaRangoHorario.RangoHorario != null)
                .GroupBy(cf => new
                {
                    cf.DiaRangoHorario.IdDia,
                    cf.DiaRangoHorario.IdRangoHorario,
                    cf.DiaRangoHorario.Dia.NombreDia,
                    cf.DiaRangoHorario.RangoHorario.HoraDesde,
                    cf.DiaRangoHorario.RangoHorario.HoraHasta
                })
                .Select(group =>
                {
                    int cupoMaximo = group.Sum(cf => cf.DiaRangoHorario.CupoMaximo);
                    int cancelados = group.Sum(cf => cf.Turnos.Count(t => t.EstadoTurno == EstadoTurno.Cancelado));
                    int finalizados = group.Sum(cf => cf.Turnos.Count(t => t.EstadoTurno == EstadoTurno.Finalizado));
                    int vencidos = group.Sum(cf => cf.Turnos.Count(t => t.EstadoTurno == EstadoTurno.Vencido));
                    int reservas = group.Sum(cf => cf.Turnos.Count);
                    int reservasActivas = reservas - cancelados;
                    decimal porcentaje = cupoMaximo > 0
                        ? Math.Round((decimal)reservasActivas / cupoMaximo * 100, 2)
                        : 0;

                    return new OcupacionHorariaDto
                    {
                        Dia = group.Key.NombreDia,
                        RangoHorario = FormatearRango(group.Key.HoraDesde, group.Key.HoraHasta),
                        CupoMaximo = cupoMaximo,
                        Reservas = reservas,
                        Finalizados = finalizados,
                        Cancelados = cancelados,
                        Vencidos = vencidos,
                        PorcentajeOcupacion = porcentaje,
                        NivelDemanda = ObtenerNivelDemanda(cupoMaximo, porcentaje)
                    };
                })
                .OrderBy(item => ObtenerOrdenDia(item.Dia))
                .ThenBy(item => item.RangoHorario)
                .ToList();
        }

        private async Task<List<FlujoReservasProfesorDto>> GetFlujoReservasProfesor(
            DateTime fechaDesde,
            DateTime fechaHastaExclusiva)
        {
            var turnos = await _context.Turnos
                .AsNoTracking()
                .Include(t => t.PersonaResponsable)
                .Include(t => t.CupoFecha)
                    .ThenInclude(cf => cf.DiaRangoHorario)
                        .ThenInclude(drh => drh.Dia)
                .Where(t => t.CupoFecha.Fecha >= fechaDesde && t.CupoFecha.Fecha < fechaHastaExclusiva)
                .ToListAsync();

            return turnos
                .Where(t => t.CupoFecha?.DiaRangoHorario?.Dia != null && t.PersonaResponsable != null)
                .GroupBy(t => new
                {
                    Dia = t.CupoFecha.DiaRangoHorario.Dia.NombreDia,
                    t.IdUsuarioResponsable,
                    t.PersonaResponsable.Nombre,
                    t.PersonaResponsable.Apellido,
                    t.EstadoTurno
                })
                .Select(group => new FlujoReservasProfesorDto
                {
                    Dia = group.Key.Dia,
                    IdUsuarioResponsable = group.Key.IdUsuarioResponsable,
                    Profesor = $"{group.Key.Nombre} {group.Key.Apellido}".Trim(),
                    EstadoTurno = group.Key.EstadoTurno.ToString(),
                    Cantidad = group.Count()
                })
                .OrderBy(item => ObtenerOrdenDia(item.Dia))
                .ThenBy(item => item.Profesor)
                .ThenBy(item => ObtenerOrdenEstadoTurno(item.EstadoTurno))
                .ToList();
        }

        private async Task<List<SocioRiesgoDto>> GetSociosSeguimiento(DateTime fechaDesde, DateTime fechaHasta)
        {
            DateTime fechaHastaExclusiva = fechaHasta.AddDays(1);

            var socios = await _context.PersonaSocios
                .AsNoTracking()
                .Include(s => s.Cuotas)
                .Include(s => s.Rutinas)
                .Include(s => s.Turnos)
                    .ThenInclude(t => t.CupoFecha)
                .ToListAsync();

            return socios
                .Select(socio =>
                {
                    var ultimaCuota = socio.Cuotas
                        .OrderByDescending(c => c.FechaFinPeriodo)
                        .FirstOrDefault();
                    var turnosPeriodo = socio.Turnos
                        .Where(t => t.CupoFecha != null
                            && t.CupoFecha.Fecha >= fechaDesde
                            && t.CupoFecha.Fecha < fechaHastaExclusiva)
                        .ToList();
                    DateTime? ultimoTurno = socio.Turnos
                        .Where(t => t.CupoFecha != null && t.EstadoTurno != EstadoTurno.Cancelado)
                        .Select(t => (DateTime?)t.CupoFecha.Fecha)
                        .Max();
                    int? diasSinAsistir = ultimoTurno.HasValue
                        ? Math.Max((fechaHasta.Date - ultimoTurno.Value.Date).Days, 0)
                        : null;
                    int rutinasActivas = socio.Rutinas.Count(r => r.Activo);
                    bool cuotaVencida = ultimaCuota == null
                        || ultimaCuota.EstadoCuota == EstadoCuota.Vencida
                        || ultimaCuota.FechaFinPeriodo.Date < fechaHasta.Date;
                    bool socioSuspendidoOEliminado = socio.EstadoSocio == EstadoSocio.Supendido
                        || socio.EstadoSocio == EstadoSocio.Eliminado;
                    string nivelRiesgo = ObtenerNivelRiesgo(
                        cuotaVencida,
                        socioSuspendidoOEliminado,
                        diasSinAsistir,
                        rutinasActivas);

                    return new SocioRiesgoDto
                    {
                        IdUsuarioSocio = socio.IdUsuario,
                        NombreCompleto = $"{socio.Nombre} {socio.Apellido}".Trim(),
                        EstadoSocio = socio.EstadoSocio.ToString(),
                        EstadoUltimaCuota = ultimaCuota?.EstadoCuota.ToString(),
                        FechaFinUltimaCuota = ultimaCuota?.FechaFinPeriodo,
                        UltimoTurno = ultimoTurno,
                        DiasSinAsistir = diasSinAsistir,
                        TurnosFinalizadosPeriodo = turnosPeriodo.Count(t => t.EstadoTurno == EstadoTurno.Finalizado),
                        TurnosCanceladosOVencidosPeriodo = turnosPeriodo.Count(t =>
                            t.EstadoTurno == EstadoTurno.Cancelado || t.EstadoTurno == EstadoTurno.Vencido),
                        RutinasActivas = rutinasActivas,
                        MontoUltimaCuotaVencida = cuotaVencida ? ultimaCuota?.Monto ?? 0 : 0,
                        NivelRiesgo = nivelRiesgo,
                        Recomendacion = ObtenerRecomendacion(nivelRiesgo)
                    };
                })
                .OrderBy(socio => ObtenerOrdenRiesgo(socio.NivelRiesgo))
                .ThenByDescending(socio => socio.DiasSinAsistir ?? int.MaxValue)
                .ThenBy(socio => socio.NombreCompleto)
                .ToList();
        }

        private async Task<decimal> GetIngresoCuotasMesActual(DateTime fechaReferencia)
        {
            DateTime inicioMes = new DateTime(fechaReferencia.Year, fechaReferencia.Month, 1);
            DateTime inicioMesSiguiente = inicioMes.AddMonths(1);

            return await _context.Cuotas
                .AsNoTracking()
                .Where(c => c.FechaPago.HasValue
                    && c.FechaPago.Value >= inicioMes
                    && c.FechaPago.Value < inicioMesSiguiente)
                .SumAsync(c => c.Monto);
        }

        private static ReportesResumenDto CrearResumen(
            List<OcupacionHorariaDto> ocupacion,
            List<SocioRiesgoDto> sociosRiesgo,
            decimal ingresoCuotasMesActual)
        {
            var horariosConCupo = ocupacion.Where(item => item.CupoMaximo > 0).ToList();
            var horarioMasDemandado = horariosConCupo
                .OrderByDescending(item => item.PorcentajeOcupacion)
                .FirstOrDefault();
            var horarioMenosUtilizado = horariosConCupo
                .OrderBy(item => item.PorcentajeOcupacion)
                .FirstOrDefault();

            return new ReportesResumenDto
            {
                TotalReservas = ocupacion.Sum(item => item.Reservas),
                PromedioOcupacion = horariosConCupo.Count > 0
                    ? Math.Round(horariosConCupo.Average(item => item.PorcentajeOcupacion), 2)
                    : 0,
                HorarioMasDemandado = horarioMasDemandado == null
                    ? null
                    : $"{horarioMasDemandado.Dia} {horarioMasDemandado.RangoHorario}",
                HorarioMenosUtilizado = horarioMenosUtilizado == null
                    ? null
                    : $"{horarioMenosUtilizado.Dia} {horarioMenosUtilizado.RangoHorario}",
                SociosRiesgoAlto = sociosRiesgo.Count(s => s.NivelRiesgo == "Alto"),
                SociosRiesgoMedio = sociosRiesgo.Count(s => s.NivelRiesgo == "Medio"),
                SociosSinRutinaActiva = sociosRiesgo.Count(s => s.RutinasActivas == 0),
                IngresoCuotasMesActual = ingresoCuotasMesActual
            };
        }

        private static (DateTime FechaDesde, DateTime FechaHasta) NormalizarRango(ReporteFiltroDto filtro)
        {
            DateTime fechaHasta = filtro.FechaHasta?.Date ?? DateTime.Today;
            DateTime fechaDesde = filtro.FechaDesde?.Date ?? fechaHasta.AddDays(-30);

            if (fechaDesde > fechaHasta)
                (fechaDesde, fechaHasta) = (fechaHasta, fechaDesde);

            return (fechaDesde, fechaHasta);
        }

        private static string FormatearRango(TimeSpan desde, TimeSpan hasta)
            => $"{desde:hh\\:mm} - {hasta:hh\\:mm}";

        private static string ObtenerNivelDemanda(int cupoMaximo, decimal porcentaje)
        {
            if (cupoMaximo <= 0) return "Sin cupo";
            if (porcentaje == 0) return "Sin uso";
            if (porcentaje >= 80) return "Alta";
            if (porcentaje <= 30) return "Baja";
            return "Media";
        }

        private static string ObtenerNivelRiesgo(
            bool cuotaVencida,
            bool socioSuspendidoOEliminado,
            int? diasSinAsistir,
            int rutinasActivas)
        {
            bool sinAsistenciaTreintaDias = !diasSinAsistir.HasValue || diasSinAsistir.Value >= 30;
            bool sinAsistenciaQuinceDias = !diasSinAsistir.HasValue || diasSinAsistir.Value >= 15;

            if ((cuotaVencida || socioSuspendidoOEliminado) && sinAsistenciaTreintaDias)
                return "Alto";

            if (cuotaVencida || sinAsistenciaQuinceDias || rutinasActivas == 0)
                return "Medio";

            return "Bajo";
        }

        private static string ObtenerRecomendacion(string nivelRiesgo)
            => nivelRiesgo switch
            {
                "Alto" => "Contactar para recuperacion o regularizacion de cuota.",
                "Medio" => "Revisar adherencia y actualizar rutina si corresponde.",
                _ => "Mantener seguimiento normal."
            };

        private static int ObtenerOrdenRiesgo(string nivelRiesgo)
            => nivelRiesgo switch
            {
                "Alto" => 0,
                "Medio" => 1,
                _ => 2
            };

        private static int ObtenerOrdenEstadoTurno(string estadoTurno)
            => estadoTurno switch
            {
                "EnCurso" => 0,
                "Finalizado" => 1,
                "Cancelado" => 2,
                "Vencido" => 3,
                _ => 4
            };

        private static int ObtenerOrdenDia(string dia)
            => dia switch
            {
                "Lunes" => 1,
                "Martes" => 2,
                "Miercoles" => 3,
                "Miércoles" => 3,
                "Jueves" => 4,
                "Viernes" => 5,
                "Sabado" => 6,
                "Sábado" => 6,
                "Domingo" => 7,
                _ => 8
            };
    }
}
