using AutoMapper;
using MindFit_Intelligence_Backend.DTOs.Calentamiento;
using MindFit_Intelligence_Backend.DTOs.Entrenamiento;
using MindFit_Intelligence_Backend.DTOs.Estiramiento;
using MindFit_Intelligence_Backend.DTOs.Rutina;
using MindFit_Intelligence_Backend.Models;
using MindFit_Intelligence_Backend.Repository.Interfaces;
using MindFit_Intelligence_Backend.Services.Interfaces;
using System.Globalization;

namespace MindFit_Intelligence_Backend.Services
{
    public class RutinaService : IRutinaService
    {
        private readonly IRutinaRepository _rutinaRepository;
        private readonly IMapper _mapper;

        public RutinaService(IRutinaRepository rutinaRepository, IMapper mapper)
        {
            _rutinaRepository = rutinaRepository;
            _mapper = mapper;
        }

        public async Task<RutinaDto?> GetRutinaPorSocioYDia(int idUsuarioSocio, int? idDia)
        {
            string? nombreDia = null;

            if (!idDia.HasValue)
            {
                nombreDia = ObtenerNombreDia(DateTime.Today);
            }

            Rutina? rutina = await _rutinaRepository.GetRutinaPorSocioYDia(idUsuarioSocio, idDia, nombreDia);

            return rutina == null ? null : _mapper.Map<RutinaDto>(rutina);
        }

        public async Task<RutinaDto?> ReemplazarBloquesRutina(int idRutina, RutinaBloquesUpdateDto bloquesDto)
        {
            List<Calentamiento> calentamientos = (bloquesDto.Calentamientos ?? new List<CalentamientoInsertDto>())
                .Select(MapearCalentamiento)
                .ToList();

            List<Entrenamiento> entrenamientos = (bloquesDto.Entrenamientos ?? new List<EntrenamientoInsertDto>())
                .Select(MapearEntrenamiento)
                .ToList();

            List<Estiramiento> estiramientos = (bloquesDto.Estiramientos ?? new List<EstiramientoInsertDto>())
                .Select(MapearEstiramiento)
                .ToList();

            var rutinaActualizada = await _rutinaRepository.ReemplazarBloquesRutina(
                idRutina,
                calentamientos,
                entrenamientos,
                estiramientos);

            return rutinaActualizada == null ? null : _mapper.Map<RutinaDto>(rutinaActualizada);
        }

        public async Task<RutinaDto?> CambiarEstadoRutina(int idRutina, bool activo)
        {
            var rutinaActualizada = await _rutinaRepository.CambiarEstadoRutina(idRutina, activo);
            return rutinaActualizada == null ? null : _mapper.Map<RutinaDto>(rutinaActualizada);
        }

        public async Task<IEnumerable<RutinaHistorialResumenDto>> GetHistorialByRutina(int idRutina)
        {
            var historial = await _rutinaRepository.GetHistorialByRutina(idRutina);

            return historial.Select(h => new RutinaHistorialResumenDto
            {
                IdRutinaHistorial = h.IdRutinaHistorial,
                IdRutina = h.IdRutina,
                Version = h.Version,
                FechaSnapshot = h.FechaSnapshot,
                ActivoSnapshot = h.ActivoSnapshot
            });
        }

        public async Task<RutinaHistorialDetalleDto?> GetHistorialDetalle(int idRutina, int idRutinaHistorial)
        {
            var historial = await _rutinaRepository.GetHistorialDetalle(idRutina, idRutinaHistorial);
            if (historial == null)
            {
                return null;
            }

            return new RutinaHistorialDetalleDto
            {
                IdRutinaHistorial = historial.IdRutinaHistorial,
                IdRutina = historial.IdRutina,
                Version = historial.Version,
                FechaSnapshot = historial.FechaSnapshot,
                ActivoSnapshot = historial.ActivoSnapshot,
                Calentamientos = historial.Calentamientos
                    .OrderBy(c => c.Orden)
                    .Select(c => new RutinaHistorialCalentamientoDto
                    {
                        IdEjercicio = c.IdEjercicio,
                        Duracion = c.Duracion,
                        Orden = c.Orden,
                        Observaciones = c.Observaciones
                    })
                    .ToList(),
                Entrenamientos = historial.Entrenamientos
                    .OrderBy(e => e.Orden)
                    .Select(e => new RutinaHistorialEntrenamientoDto
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
                Estiramientos = historial.Estiramientos
                    .OrderBy(e => e.Orden)
                    .Select(e => new RutinaHistorialEstiramientoDto
                    {
                        IdEjercicio = e.IdEjercicio,
                        Duracion = e.Duracion,
                        Orden = e.Orden,
                        Observaciones = e.Observaciones
                    })
                    .ToList()
            };
        }

        public async Task<RutinaDto?> RestaurarRutinaDesdeHistorial(int idRutina, int idRutinaHistorial)
        {
            var rutinaRestaurada = await _rutinaRepository.RestaurarRutinaDesdeHistorial(idRutina, idRutinaHistorial);
            return rutinaRestaurada == null ? null : _mapper.Map<RutinaDto>(rutinaRestaurada);
        }

        private static string ObtenerNombreDia(DateTime fecha)
        {
            var cultura = new CultureInfo("es-ES");
            string diaCultura = fecha.ToString("dddd", cultura);
            return cultura.TextInfo.ToTitleCase(diaCultura);
        }

        private static Calentamiento MapearCalentamiento(CalentamientoInsertDto dto)
        {
            return new Calentamiento
            {
                IdEjercicio = dto.IdEjercicio,
                Duracion = dto.Duracion,
                Orden = dto.Orden,
                Observaciones = dto.Observaciones
            };
        }

        private static Entrenamiento MapearEntrenamiento(EntrenamientoInsertDto dto)
        {
            return new Entrenamiento
            {
                IdEjercicio = dto.IdEjercicio,
                Series = dto.Series,
                Repeticiones = dto.Repeticiones,
                PesoAsignado = dto.PesoAsignado,
                TiempoDescansoSegundos = dto.TiempoDescansoSegundos,
                Orden = dto.Orden,
                Observaciones = dto.Observaciones
            };
        }

        private static Estiramiento MapearEstiramiento(EstiramientoInsertDto dto)
        {
            return new Estiramiento
            {
                IdEjercicio = dto.IdEjercicio,
                Duracion = dto.Duracion,
                Orden = dto.Orden,
                Observaciones = dto.Observaciones
            };
        }
    }
}
