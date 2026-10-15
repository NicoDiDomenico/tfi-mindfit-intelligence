using MindFit_Intelligence_Backend.DTOs.Ejercicios;

namespace MindFit_Intelligence_Backend.Services.Interfaces
{
    public interface IEjercicioService
    {
        List<string> Errors { get; }

        Task<bool> ValidateAsync(EjercicioInsertDto dto);
        Task<bool> ValidateAsync(EjercicioUpdateDto dto);

        Task<IEnumerable<EjercicioDto>> GetEjerciciosAsync(int? idGrupoMuscular);
        Task<EjercicioDto?> GetEjercicioByIdAsync(int id);
        Task<EjercicioDto?> CreateEjercicioAsync(EjercicioInsertDto insertDto);
        Task<EjercicioDto?> UpdateEjercicioAsync(int id, EjercicioUpdateDto updateDto);
        Task<EjercicioDto?> DeleteEjercicioAsync(int id);
    }
}