using System.Globalization;
using System.Text;
using Microsoft.EntityFrameworkCore;
using MindFit_Intelligence_Backend.DTOs.SocioInsights;
using MindFit_Intelligence_Backend.Models;
using MindFit_Intelligence_Backend.Models.Enums;
using MindFit_Intelligence_Backend.Services.Interfaces;

namespace MindFit_Intelligence_Backend.Services
{
    public class SocioInsightsService : ISocioInsightsService
    {
        private const int MaxRecomendaciones = 4;
        private readonly MindFitIntelligenceContext _context;

        public SocioInsightsService(MindFitIntelligenceContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<SocioRecomendacionDto>> GetRecomendaciones(int idUsuarioSocio)
        {
            var now = DateTime.Now;
            var turnos = await GetTurnosSocio(idUsuarioSocio);
            var rutinas = await GetRutinasSocio(idUsuarioSocio);
            var recomendaciones = new List<SocioRecomendacionDto>();

            AgregarRecomendacionesContinuidad(recomendaciones, turnos, now);
            AgregarRecomendacionProximoTurno(recomendaciones, turnos, now);
            AgregarRecomendacionFrecuencia(recomendaciones, turnos, now);
            AgregarRecomendacionesRutina(recomendaciones, rutinas, now);

            return recomendaciones.Take(MaxRecomendaciones);
        }

        private async Task<List<TurnoInsight>> GetTurnosSocio(int idUsuarioSocio)
        {
            return await _context.Turnos
                .AsNoTracking()
                .Where(t => t.IdUsuarioSocio == idUsuarioSocio)
                .Select(t => new TurnoInsight
                {
                    IdTurno = t.IdTurno,
                    Fecha = t.CupoFecha.Fecha,
                    HoraDesde = t.CupoFecha.DiaRangoHorario.RangoHorario.HoraDesde,
                    HoraHasta = t.CupoFecha.DiaRangoHorario.RangoHorario.HoraHasta,
                    EstadoTurno = t.EstadoTurno,
                    NombreResponsable = t.PersonaResponsable.Nombre,
                    ApellidoResponsable = t.PersonaResponsable.Apellido
                })
                .ToListAsync();
        }

        private async Task<List<RutinaInsight>> GetRutinasSocio(int idUsuarioSocio)
        {
            return await _context.Rutinas
                .AsNoTracking()
                .Where(r => r.IdPersonaSocio == idUsuarioSocio && r.Activo)
                .Select(r => new RutinaInsight
                {
                    IdRutina = r.IdRutina,
                    FechaModificacion = r.FechaModificacion,
                    GruposEntrenamiento = r.Entrenamientos
                        .Select(e => e.Ejercicio.GrupoMuscular.NombreMusculo)
                        .ToList()
                })
                .ToListAsync();
        }

        private static void AgregarRecomendacionesContinuidad(
            List<SocioRecomendacionDto> recomendaciones,
            List<TurnoInsight> turnos,
            DateTime now)
        {
            var desde = now.Date.AddDays(-30);
            var turnosNoConcretados = turnos.Count(t =>
                t.Fecha.Date >= desde
                && t.Fecha.Date <= now.Date
                && (t.EstadoTurno == EstadoTurno.Cancelado || t.EstadoTurno == EstadoTurno.Vencido));

            if (turnosNoConcretados < 3)
            {
                return;
            }

            recomendaciones.Add(new SocioRecomendacionDto
            {
                Id = "continuidad-cancelados-vencidos-30d",
                Tipo = "continuidad",
                Prioridad = "warning",
                Titulo = "Continuidad de turnos",
                Mensaje = "Detectamos varios turnos cancelados o vencidos este mes. Probar un horario mas comodo podria ayudarte a sostener la rutina.",
                AccionTexto = "Reservar turno",
                AccionUrl = "/socio/inicio?accion=nuevo-turno"
            });
        }

        private static void AgregarRecomendacionProximoTurno(
            List<SocioRecomendacionDto> recomendaciones,
            List<TurnoInsight> turnos,
            DateTime now)
        {
            var proximoTurno = turnos
                .Where(t => t.EstadoTurno == EstadoTurno.EnCurso)
                .Where(t => t.Fecha.Add(t.HoraDesde) >= now)
                .OrderBy(t => t.Fecha)
                .ThenBy(t => t.HoraDesde)
                .FirstOrDefault();

            if (proximoTurno is null)
            {
                recomendaciones.Add(new SocioRecomendacionDto
                {
                    Id = "turno-sin-proximos",
                    Tipo = "turno",
                    Prioridad = "warning",
                    Titulo = "Reserva pendiente",
                    Mensaje = "No tenes turnos proximos. Agendar tu proximo entrenamiento puede ayudarte a sostener continuidad.",
                    AccionTexto = "Reservar turno",
                    AccionUrl = "/socio/inicio?accion=nuevo-turno"
                });

                return;
            }

            var entrenador = $"{proximoTurno.NombreResponsable} {proximoTurno.ApellidoResponsable}".Trim();
            var entrenadorTexto = string.IsNullOrWhiteSpace(entrenador)
                ? string.Empty
                : $" con {entrenador}";

            recomendaciones.Add(new SocioRecomendacionDto
            {
                Id = $"turno-proximo-{proximoTurno.IdTurno}",
                Tipo = "turno",
                Prioridad = "info",
                Titulo = "Proximo turno",
                Mensaje = $"Tenes un turno {FormatTurnoDate(proximoTurno.Fecha, now)} de {FormatTime(proximoTurno.HoraDesde)} a {FormatTime(proximoTurno.HoraHasta)}{entrenadorTexto}.",
                AccionTexto = null,
                AccionUrl = null
            });
        }

        private static void AgregarRecomendacionFrecuencia(
            List<SocioRecomendacionDto> recomendaciones,
            List<TurnoInsight> turnos,
            DateTime now)
        {
            var desde = now.Date.AddDays(-14);
            var turnosFinalizados = turnos.Count(t =>
                t.Fecha.Date >= desde
                && t.Fecha.Date <= now.Date
                && t.EstadoTurno == EstadoTurno.Finalizado);

            if (turnosFinalizados >= 2)
            {
                return;
            }

            var prioridad = turnosFinalizados == 0 ? "warning" : "info";
            var asistenciaTexto = turnosFinalizados == 1
                ? "Tuviste 1 asistencia"
                : "No registras asistencias";

            recomendaciones.Add(new SocioRecomendacionDto
            {
                Id = $"frecuencia-baja-14d-{turnosFinalizados}",
                Tipo = "frecuencia",
                Prioridad = prioridad,
                Titulo = "Frecuencia recomendada",
                Mensaje = $"{asistenciaTexto} en los ultimos 14 dias. Intentar sostener 2 o 3 turnos por semana puede ayudarte a mantener continuidad.",
                AccionTexto = "Reservar turno",
                AccionUrl = "/socio/inicio?accion=nuevo-turno"
            });
        }

        private static void AgregarRecomendacionesRutina(
            List<SocioRecomendacionDto> recomendaciones,
            List<RutinaInsight> rutinas,
            DateTime now)
        {
            var rutinaAntigua = rutinas
                .Where(r => (now.Date - r.FechaModificacion.Date).TotalDays > 30)
                .OrderBy(r => r.FechaModificacion)
                .FirstOrDefault();

            if (rutinaAntigua is not null)
            {
                recomendaciones.Add(new SocioRecomendacionDto
                {
                    Id = "rutina-sin-actualizar-30d",
                    Tipo = "rutina",
                    Prioridad = "info",
                    Titulo = "Revision de rutina",
                    Mensaje = "Tu rutina no se actualiza hace mas de 30 dias. Podrias pedirle a tu entrenador una revision de cargas o variantes.",
                    AccionTexto = "Ver rutinas",
                    AccionUrl = "/socio/rutinas"
                });
            }

            var grupoRepetido = rutinas
                .SelectMany(r => r.GruposEntrenamiento)
                .GroupBy(g => g)
                .Select(g => new { Grupo = g.Key, Cantidad = g.Count() })
                .OrderByDescending(g => g.Cantidad)
                .ThenBy(g => g.Grupo.ToString())
                .FirstOrDefault(g => g.Cantidad >= 3);

            if (grupoRepetido is null)
            {
                return;
            }

            recomendaciones.Add(new SocioRecomendacionDto
            {
                Id = $"variante-grupo-{NormalizeId(grupoRepetido.Grupo.ToString())}",
                Tipo = "variante",
                Prioridad = "info",
                Titulo = "Variantes de ejercicios",
                Mensaje = $"Tu rutina trabaja bastante {grupoRepetido.Grupo}. Consultar variantes con tu entrenador puede ayudarte a progresar sin repetir siempre el mismo estimulo.",
                AccionTexto = "Ver rutinas",
                AccionUrl = "/socio/rutinas"
            });
        }

        private static string FormatTurnoDate(DateTime date, DateTime now)
        {
            if (date.Date == now.Date)
            {
                return "hoy";
            }

            if (date.Date == now.Date.AddDays(1))
            {
                return "manana";
            }

            var culture = new CultureInfo("es-AR");
            var weekday = culture.TextInfo.ToTitleCase(date.ToString("dddd", culture));
            return $"el {weekday} {date:dd/MM}";
        }

        private static string FormatTime(TimeSpan time)
        {
            return time.ToString(@"hh\:mm");
        }

        private static string NormalizeId(string value)
        {
            var normalized = value.Normalize(NormalizationForm.FormD);
            var chars = normalized
                .Where(c => CharUnicodeInfo.GetUnicodeCategory(c) != UnicodeCategory.NonSpacingMark)
                .Select(c => char.IsLetterOrDigit(c) ? char.ToLowerInvariant(c) : '-')
                .ToArray();

            return new string(chars).Trim('-');
        }

        private class TurnoInsight
        {
            public int IdTurno { get; set; }
            public DateTime Fecha { get; set; }
            public TimeSpan HoraDesde { get; set; }
            public TimeSpan HoraHasta { get; set; }
            public EstadoTurno EstadoTurno { get; set; }
            public string NombreResponsable { get; set; } = string.Empty;
            public string ApellidoResponsable { get; set; } = string.Empty;
        }

        private class RutinaInsight
        {
            public int IdRutina { get; set; }
            public DateTime FechaModificacion { get; set; }
            public List<Musculo> GruposEntrenamiento { get; set; } = new();
        }
    }
}
