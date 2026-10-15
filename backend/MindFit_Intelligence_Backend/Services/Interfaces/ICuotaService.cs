using MindFit_Intelligence_Backend.DTOs.Cuota;

namespace MindFit_Intelligence_Backend.Services.Interfaces
{
    public interface ICuotaService
    {
        Task<IEnumerable<CuotaDto>> GetBySocio(int idUsuario);
        Task<CuotaDto?> GetById(int id);
        Task<CuotaDto?> Delete(int id);
        Task<int> ActualizarCuotasVencidas();
    }
}
