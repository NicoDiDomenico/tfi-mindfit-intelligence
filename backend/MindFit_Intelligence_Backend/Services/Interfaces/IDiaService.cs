using MindFit_Intelligence_Backend.DTOs.Dia;

namespace MindFit_Intelligence_Backend.Services.Interfaces
{
    public interface IDiaService
    {
        Task<IEnumerable<DiaDto>> GetDias();
    }
}
