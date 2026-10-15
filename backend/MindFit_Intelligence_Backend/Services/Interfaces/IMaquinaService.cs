using MindFit_Intelligence_Backend.DTOs.Maquinas;

namespace MindFit_Intelligence_Backend.Services.Interfaces
{
    public interface IMaquinaService
    {
        List<string> Errors { get; }
        bool Validate(MaquinaInsertDto dto);
        bool Validate(MaquinaUpdateDto dto);

        Task<IEnumerable<MaquinaDto>> GetMaquinasAsync();
        Task<MaquinaDto?> GetMaquinaByIdAsync(int id);
        Task<MaquinaDto?> CreateMaquinaAsync(MaquinaInsertDto insertDto);
        Task<MaquinaDto?> UpdateMaquinaAsync(int id, MaquinaUpdateDto updateDto);
        Task<MaquinaDto?> DeleteMaquinaAsync(int id);
    }
}