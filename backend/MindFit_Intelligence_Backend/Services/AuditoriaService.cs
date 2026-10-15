using MindFit_Intelligence_Backend.DTOs.Auditoria;
using MindFit_Intelligence_Backend.Models;
using MindFit_Intelligence_Backend.Repository.Interfaces;
using MindFit_Intelligence_Backend.Services.Auditoria;
using MindFit_Intelligence_Backend.Services.Interfaces;
using System.Text.Json;

namespace MindFit_Intelligence_Backend.Services
{
    public class AuditoriaService : IAuditoriaService
    {
        private readonly IAuditoriaRepository _auditoriaRepository;
        private readonly ICurrentUserService _currentUserService;
        private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web)
        {
            WriteIndented = false
        };

        public AuditoriaService(
            IAuditoriaRepository auditoriaRepository,
            ICurrentUserService currentUserService)
        {
            _auditoriaRepository = auditoriaRepository;
            _currentUserService = currentUserService;
        }

        public RutinaAuditoriaSnapshot? CrearSnapshotRutina(Rutina? rutina)
        {
            if (rutina == null)
                return null;

            return new RutinaAuditoriaSnapshot
            {
                IdRutina = rutina.IdRutina,
                IdPersonaSocio = rutina.IdPersonaSocio,
                IdDia = rutina.IdDia,
                FechaModificacion = rutina.FechaModificacion,
                Activo = rutina.Activo,
                Calentamientos = rutina.Calentamientos
                    .OrderBy(c => c.Orden)
                    .Select(c => new RutinaAuditoriaCalentamiento
                    {
                        IdEjercicio = c.IdEjercicio,
                        Ejercicio = c.Ejercicio?.DescEjercicio,
                        Duracion = c.Duracion,
                        Orden = c.Orden,
                        Observaciones = c.Observaciones
                    })
                    .ToList(),
                Entrenamientos = rutina.Entrenamientos
                    .OrderBy(e => e.Orden)
                    .Select(e => new RutinaAuditoriaEntrenamiento
                    {
                        IdEjercicio = e.IdEjercicio,
                        Ejercicio = e.Ejercicio?.DescEjercicio,
                        Series = e.Series,
                        Repeticiones = e.Repeticiones,
                        PesoAsignado = e.PesoAsignado,
                        TiempoDescansoSegundos = e.TiempoDescansoSegundos,
                        Orden = e.Orden,
                        Observaciones = e.Observaciones
                    })
                    .ToList(),
                Estiramientos = rutina.Estiramientos
                    .OrderBy(e => e.Orden)
                    .Select(e => new RutinaAuditoriaEstiramiento
                    {
                        IdEjercicio = e.IdEjercicio,
                        Ejercicio = e.Ejercicio?.DescEjercicio,
                        Duracion = e.Duracion,
                        Orden = e.Orden,
                        Observaciones = e.Observaciones
                    })
                    .ToList()
            };
        }

        public string? SerializarSnapshot(RutinaAuditoriaSnapshot? snapshot)
            => snapshot == null ? null : JsonSerializer.Serialize(snapshot, JsonOptions);

        public string? CrearCambiosRutinaJson(RutinaAuditoriaSnapshot? original, RutinaAuditoriaSnapshot? nuevo)
        {
            if (original == null && nuevo == null)
                return null;

            var cambios = new
            {
                estado = new
                {
                    activoAnterior = original?.Activo,
                    activoNuevo = nuevo?.Activo,
                    modificado = original?.Activo != nuevo?.Activo
                },
                calentamientos = CrearCambiosBloque(
                    original?.Calentamientos.Select(c => (c.Orden, c.IdEjercicio, Valores: JsonSerializer.Serialize(c, JsonOptions))).ToList(),
                    nuevo?.Calentamientos.Select(c => (c.Orden, c.IdEjercicio, Valores: JsonSerializer.Serialize(c, JsonOptions))).ToList()),
                entrenamientos = CrearCambiosBloque(
                    original?.Entrenamientos.Select(e => (e.Orden, e.IdEjercicio, Valores: JsonSerializer.Serialize(e, JsonOptions))).ToList(),
                    nuevo?.Entrenamientos.Select(e => (e.Orden, e.IdEjercicio, Valores: JsonSerializer.Serialize(e, JsonOptions))).ToList()),
                estiramientos = CrearCambiosBloque(
                    original?.Estiramientos.Select(e => (e.Orden, e.IdEjercicio, Valores: JsonSerializer.Serialize(e, JsonOptions))).ToList(),
                    nuevo?.Estiramientos.Select(e => (e.Orden, e.IdEjercicio, Valores: JsonSerializer.Serialize(e, JsonOptions))).ToList())
            };

            return JsonSerializer.Serialize(cambios, JsonOptions);
        }

        public async Task RegistrarEventoRutinaAsync(
            int idRutina,
            string accion,
            RutinaAuditoriaSnapshot? original,
            RutinaAuditoriaSnapshot? nuevo,
            string resultado = "Exitoso",
            string? mensaje = null)
        {
            var evento = new AuditoriaEvento
            {
                FechaHoraUtc = DateTime.UtcNow,
                IdUsuario = _currentUserService.IdUsuario,
                Username = _currentUserService.Username,
                IdGimnasio = _currentUserService.IdGimnasio,
                Entidad = "Rutina",
                IdEntidad = idRutina,
                Accion = accion,
                Endpoint = _currentUserService.Endpoint,
                MetodoHttp = _currentUserService.MetodoHttp,
                IpAddress = _currentUserService.IpAddress,
                UserAgent = _currentUserService.UserAgent,
                ValoresOriginalesJson = SerializarSnapshot(original),
                ValoresNuevosJson = SerializarSnapshot(nuevo),
                CambiosJson = CrearCambiosRutinaJson(original, nuevo),
                Resultado = resultado,
                Mensaje = mensaje
            };

            await _auditoriaRepository.AddEventoAsync(evento);
            await _auditoriaRepository.SaveAsync();
        }

        public async Task RegistrarSesionAsync(
            string tipoEvento,
            string resultado,
            string? usernameIntentado,
            int? idUsuario = null,
            string? motivoFallo = null)
        {
            var sesion = new AuditoriaSesion
            {
                FechaHoraUtc = DateTime.UtcNow,
                IdUsuario = idUsuario ?? _currentUserService.IdUsuario,
                UsernameIntentado = usernameIntentado ?? _currentUserService.Username,
                IdGimnasio = _currentUserService.IdGimnasio,
                TipoEvento = tipoEvento,
                Resultado = resultado,
                IpAddress = _currentUserService.IpAddress,
                UserAgent = _currentUserService.UserAgent,
                MotivoFallo = motivoFallo
            };

            await _auditoriaRepository.AddSesionAsync(sesion);
            await _auditoriaRepository.SaveAsync();
        }

        public async Task<AuditoriaResultadoDto<AuditoriaEventoDto>> GetEventos(AuditoriaEventoFiltroDto filtro)
        {
            NormalizarPaginacion(filtro);
            var (items, total) = await _auditoriaRepository.GetEventosAsync(filtro);

            return new AuditoriaResultadoDto<AuditoriaEventoDto>
            {
                Items = items.Select(MapEvento).ToList(),
                Total = total,
                Pagina = filtro.Pagina,
                TamanoPagina = filtro.TamanoPagina
            };
        }

        public async Task<AuditoriaEventoDto?> GetEventoById(int idAuditoriaEvento)
        {
            var evento = await _auditoriaRepository.GetEventoByIdAsync(idAuditoriaEvento);
            return evento == null ? null : MapEvento(evento);
        }

        public async Task<AuditoriaResultadoDto<AuditoriaSesionDto>> GetSesiones(AuditoriaSesionFiltroDto filtro)
        {
            NormalizarPaginacion(filtro);
            var (items, total) = await _auditoriaRepository.GetSesionesAsync(filtro);

            return new AuditoriaResultadoDto<AuditoriaSesionDto>
            {
                Items = items.Select(MapSesion).ToList(),
                Total = total,
                Pagina = filtro.Pagina,
                TamanoPagina = filtro.TamanoPagina
            };
        }

        public async Task<AuditoriaReporteResumenDto> GetResumen(DateTime? fechaDesde, DateTime? fechaHasta)
        {
            return new AuditoriaReporteResumenDto
            {
                TotalEventos = await _auditoriaRepository.CountEventosAsync(fechaDesde, fechaHasta),
                TotalSesiones = await _auditoriaRepository.CountSesionesAsync(fechaDesde, fechaHasta),
                EventosPorAccion = await _auditoriaRepository.GetEventosPorAccionAsync(fechaDesde, fechaHasta),
                SesionesPorTipo = await _auditoriaRepository.GetSesionesPorTipoAsync(fechaDesde, fechaHasta)
            };
        }

        private static object CrearCambiosBloque(
            List<(int Orden, int IdEjercicio, string Valores)>? original,
            List<(int Orden, int IdEjercicio, string Valores)>? nuevo)
        {
            original ??= new();
            nuevo ??= new();

            var originalPorOrden = original.ToDictionary(i => i.Orden);
            var nuevoPorOrden = nuevo.ToDictionary(i => i.Orden);
            var ordenes = originalPorOrden.Keys.Union(nuevoPorOrden.Keys).OrderBy(o => o);

            return new
            {
                agregados = ordenes
                    .Where(o => !originalPorOrden.ContainsKey(o) && nuevoPorOrden.ContainsKey(o))
                    .Select(o => new { orden = o, nuevo = nuevoPorOrden[o].IdEjercicio })
                    .ToList(),
                eliminados = ordenes
                    .Where(o => originalPorOrden.ContainsKey(o) && !nuevoPorOrden.ContainsKey(o))
                    .Select(o => new { orden = o, anterior = originalPorOrden[o].IdEjercicio })
                    .ToList(),
                modificados = ordenes
                    .Where(o => originalPorOrden.ContainsKey(o)
                                && nuevoPorOrden.ContainsKey(o)
                                && originalPorOrden[o].Valores != nuevoPorOrden[o].Valores)
                    .Select(o => new
                    {
                        orden = o,
                        anterior = originalPorOrden[o].IdEjercicio,
                        nuevo = nuevoPorOrden[o].IdEjercicio
                    })
                    .ToList()
            };
        }

        private static void NormalizarPaginacion(AuditoriaEventoFiltroDto filtro)
        {
            filtro.Pagina = Math.Max(filtro.Pagina, 1);
            filtro.TamanoPagina = Math.Clamp(filtro.TamanoPagina, 1, 200);
        }

        private static void NormalizarPaginacion(AuditoriaSesionFiltroDto filtro)
        {
            filtro.Pagina = Math.Max(filtro.Pagina, 1);
            filtro.TamanoPagina = Math.Clamp(filtro.TamanoPagina, 1, 200);
        }

        private static AuditoriaEventoDto MapEvento(AuditoriaEvento evento)
        {
            return new AuditoriaEventoDto
            {
                IdAuditoriaEvento = evento.IdAuditoriaEvento,
                FechaHoraUtc = evento.FechaHoraUtc,
                IdUsuario = evento.IdUsuario,
                Username = evento.Username,
                IdGimnasio = evento.IdGimnasio,
                Entidad = evento.Entidad,
                IdEntidad = evento.IdEntidad,
                Accion = evento.Accion,
                Endpoint = evento.Endpoint,
                MetodoHttp = evento.MetodoHttp,
                IpAddress = evento.IpAddress,
                UserAgent = evento.UserAgent,
                ValoresOriginalesJson = evento.ValoresOriginalesJson,
                ValoresNuevosJson = evento.ValoresNuevosJson,
                CambiosJson = evento.CambiosJson,
                Resultado = evento.Resultado,
                Mensaje = evento.Mensaje
            };
        }

        private static AuditoriaSesionDto MapSesion(AuditoriaSesion sesion)
        {
            return new AuditoriaSesionDto
            {
                IdAuditoriaSesion = sesion.IdAuditoriaSesion,
                FechaHoraUtc = sesion.FechaHoraUtc,
                IdUsuario = sesion.IdUsuario,
                UsernameIntentado = sesion.UsernameIntentado,
                IdGimnasio = sesion.IdGimnasio,
                TipoEvento = sesion.TipoEvento,
                Resultado = sesion.Resultado,
                IpAddress = sesion.IpAddress,
                UserAgent = sesion.UserAgent,
                MotivoFallo = sesion.MotivoFallo
            };
        }
    }
}
