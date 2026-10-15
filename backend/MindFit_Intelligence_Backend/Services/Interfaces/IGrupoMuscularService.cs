using MindFit_Intelligence_Backend.DTOs.GrupoMuscular;

namespace MindFit_Intelligence_Backend.Services.Interfaces
{
    public interface IGrupoMuscularService
    {
        List<string> Errors { get; }

        Task<IEnumerable<GrupoMuscularDto>> GetAsync();
        Task<GrupoMuscularDto?> GetByIdAsync(int id);
    }
}
