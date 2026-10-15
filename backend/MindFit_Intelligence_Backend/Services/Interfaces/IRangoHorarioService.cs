using MindFit_Intelligence_Backend.DTOs.RangoHorario;

namespace MindFit_Intelligence_Backend.Services.Interfaces
{
    public interface IRangoHorarioService
    {
        Task<IEnumerable<RangoHorarioDto>> GetAsync();
    }
}
