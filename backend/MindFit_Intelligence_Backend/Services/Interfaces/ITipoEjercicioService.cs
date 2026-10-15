using MindFit_Intelligence_Backend.DTOs.TipoEjercicio;

namespace MindFit_Intelligence_Backend.Services.Interfaces
{
    public interface ITipoEjercicioService
    {
        List<string> Errors { get; }

        Task<IEnumerable<TipoEjercicioDto>> GetAsync();
        Task<TipoEjercicioDto?> GetByIdAsync(int id);
    }
}
