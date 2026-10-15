using MindFit_Intelligence_Backend.DTOs.Equipamientos;

namespace MindFit_Intelligence_Backend.Services.Interfaces
{
    public interface IEquipamientoService
    {
        List<string> Errors { get; }

        bool Validate(EquipamientoInsertDto dto);
        bool Validate(EquipamientoUpdateDto dto);

        Task<IEnumerable<EquipamientoDto>> GetEquipamientosAsync();
        Task<EquipamientoDto?> GetEquipamientoByIdAsync(int id);
        Task<EquipamientoDto?> CreateEquipamientoAsync(EquipamientoInsertDto insertDto);
        Task<EquipamientoDto?> UpdateEquipamientoAsync(int id, EquipamientoUpdateDto updateDto);
        Task<EquipamientoDto?> DeleteEquipamientoAsync(int id);
    }
}