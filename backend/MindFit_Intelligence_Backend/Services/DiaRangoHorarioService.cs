using MindFit_Intelligence_Backend.DTOs.DiaRangoHorario;
using MindFit_Intelligence_Backend.DTOs.DiaRangoHorarioResponsable;
using MindFit_Intelligence_Backend.Models;
using MindFit_Intelligence_Backend.Repository;
using MindFit_Intelligence_Backend.Repository.Interfaces;
using MindFit_Intelligence_Backend.Services.Interfaces;

namespace MindFit_Intelligence_Backend.Services
{
    public class DiaRangoHorarioService : IDiaRangoHorarioService
    {
        private static readonly Dictionary<DayOfWeek, string> _diasEspanol = new()
        {
            { DayOfWeek.Monday, "Lunes" },
            { DayOfWeek.Tuesday, "Martes" },
            { DayOfWeek.Wednesday, "Miércoles" },
            { DayOfWeek.Thursday, "Jueves" },
            { DayOfWeek.Friday, "Viernes" },
            { DayOfWeek.Saturday, "Sábado" },
            { DayOfWeek.Sunday, "Domingo" }
        };

        private readonly IDiaRangoHorarioRepository _diaRangoHorarioRepository;
        private readonly IDiaRangoHorarioResponsableRepository _diaRangoHorarioResponsableRepository;
        private readonly ICupoFechaRepository _cupoFechaRepository;
        public List<string> Errors { get; }

        public DiaRangoHorarioService(
        IDiaRangoHorarioRepository diaRangoHorarioRepository,
        IDiaRangoHorarioResponsableRepository diaRangoHorarioResponsableRepository,
        ICupoFechaRepository cupoFechaRepository)
        {
            Errors = new List<string>();
            _diaRangoHorarioRepository = diaRangoHorarioRepository;
            _diaRangoHorarioResponsableRepository = diaRangoHorarioResponsableRepository;
            _cupoFechaRepository = cupoFechaRepository;
        }

        public async Task<bool> ActivarDesactivarHorario(int IdDiaRangoHorario, DiaRangoHorarioUpdateDto dto)
        {
            Errors.Clear();

            var diaRangoHorario = await _diaRangoHorarioRepository.GetById(IdDiaRangoHorario);

            if (diaRangoHorario == null)
            {
                Errors.Add($"No se encontró el rango horario con ID: {IdDiaRangoHorario}");
                return false;
            }

            // Crear validacion cupoMaximo >= cupoActual para no permitir bajar el máximo por debajo de los turnos ya tomados.
            foreach (var cupoFecha in diaRangoHorario.CupoFechas)
            {
                if (cupoFecha.CupoActual > dto.CupoMaximo && cupoFecha.Fecha >= DateTime.Now) // Solo consideramos las fechas futuras o actuales, no las pasadas.
                {
                    Errors.Add($"No se puede establecer el cupo máximo en {dto.CupoMaximo} porque el día {cupoFecha.Fecha.ToShortDateString()} ya tiene {cupoFecha.CupoActual} turnos tomados.");
                    return false;
                }
            }

            diaRangoHorario.setActivo(dto.Activo);
            diaRangoHorario.CupoMaximo = dto.CupoMaximo;

            await _diaRangoHorarioRepository.Save();

            return true;
        }

        public async Task<bool> AsignarResponsable(DiaRangoHorarioResponsableInsertDto dto)
        {
        var existe = await _diaRangoHorarioResponsableRepository.GetByIds(dto.IdDiaRangoHorario, dto.IdUsuarioResponsable);

            if (existe != null)
                return false;

            var nuevo = new DiaRangoHorarioResponsable
            {
                IdDiaRangoHorario = dto.IdDiaRangoHorario,
                IdUsuarioResponsable = dto.IdUsuarioResponsable,
                Observaciones = dto.Observaciones
            };

        await _diaRangoHorarioResponsableRepository.Add(nuevo);
        await _diaRangoHorarioResponsableRepository.Save();

            return true;
        }

        public async Task<bool> ActualizarResponsable(DiaRangoHorarioResponsableUpdateDto dto)
        {
        var responsable = await _diaRangoHorarioResponsableRepository.GetByIds(dto.IdDiaRangoHorario, dto.IdUsuarioResponsable);

            if (responsable == null)
                return false;

            responsable.Observaciones = dto.Observaciones;

        await _diaRangoHorarioResponsableRepository.Save();

            return true;
        }

        public async Task<bool> QuitarResponsable(DiaRangoHorarioResponsableDeleteDto dto)
        {
        var responsable = await _diaRangoHorarioResponsableRepository.GetByIds(dto.IdDiaRangoHorario, dto.IdUsuarioResponsable);

            if (responsable == null)
                return false;

        await _diaRangoHorarioResponsableRepository.Remove(responsable);
        await _diaRangoHorarioResponsableRepository.Save();

            return true;
        }

        public async Task<IEnumerable<GrillaDiaRangoHorarioDto>> GetAll()
        {
            var diaRangoHorarios = await _diaRangoHorarioRepository.GetAll();
            return MapToGrillaDto(diaRangoHorarios);
        }

        public async Task<IEnumerable<GrillaDiaRangoHorarioDto>> GetByFecha(DateTime fecha)
        {
            if (!_diasEspanol.TryGetValue(fecha.DayOfWeek, out var nombreDia))
                return Enumerable.Empty<GrillaDiaRangoHorarioDto>();

            var diaRangoHorarios = await _diaRangoHorarioRepository.GetByNombreDia(nombreDia);
            var grillaDiaRangoHorarioDtos = MapToGrillaDto(diaRangoHorarios);

            foreach (var drh in grillaDiaRangoHorarioDtos)
            {
                var cupoFecha = await _cupoFechaRepository.GetByDiaRangoHorarioYFecha(drh.IdDiaRangoHorario, fecha);
                drh.CupoActual = cupoFecha?.CupoActual ?? 0;
            }

            return grillaDiaRangoHorarioDtos;
        }

        private static IEnumerable<GrillaDiaRangoHorarioDto> MapToGrillaDto(IEnumerable<DiaRangoHorario> diaRangoHorarios)
        {
            List<GrillaDiaRangoHorarioDto> grillaDiaRangoHorarioDtos = new List<GrillaDiaRangoHorarioDto>();

            foreach (var drh in diaRangoHorarios)
            {
                grillaDiaRangoHorarioDtos.Add(new GrillaDiaRangoHorarioDto
                {
                    IdDiaRangoHorario = drh.IdDiaRangoHorario,

                    CupoActual = 0,
                    CupoMaximo = drh.CupoMaximo,
                    Activo = drh.Activo,
                    HoraDesde = drh.RangoHorario.HoraDesde,
                    HoraHasta = drh.RangoHorario.HoraHasta,
                    NombreDia = drh.Dia.NombreDia,
                    Responsables = drh.DiaRangoHorarioResponsables.Select(r => new GrillaDiaRangoHorarioResponsableDto
                    {
                        IdUsuarioResponsable = r.IdUsuarioResponsable,
                        Nombre = r.PersonaResponsable.Nombre,
                        Apellido = r.PersonaResponsable.Apellido,
                        Observaciones = r.Observaciones
                    }).ToList()
                });
            }

            return grillaDiaRangoHorarioDtos;
        }
    }
}
