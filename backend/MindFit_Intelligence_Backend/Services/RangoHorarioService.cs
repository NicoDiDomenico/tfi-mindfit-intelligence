using MindFit_Intelligence_Backend.DTOs.RangoHorario;
using MindFit_Intelligence_Backend.Repository.Interfaces;
using MindFit_Intelligence_Backend.Services.Interfaces;

namespace MindFit_Intelligence_Backend.Services
{
    public class RangoHorarioService : IRangoHorarioService
    {
        private readonly IRangoHorarioRepository _rangoHorarioRepository;

        public RangoHorarioService(IRangoHorarioRepository rangoHorarioRepository)
        {
            _rangoHorarioRepository = rangoHorarioRepository;
        }

        public async Task<IEnumerable<RangoHorarioDto>> GetAsync()
        {
            var rangosHorarios = await _rangoHorarioRepository.Get();

            return rangosHorarios.Select(rh => new RangoHorarioDto
            {
                IdRangoHorario = rh.IdRangoHorario,
                HoraDesde = rh.HoraDesde,
                HoraHasta = rh.HoraHasta
            });
        }
    }
}
