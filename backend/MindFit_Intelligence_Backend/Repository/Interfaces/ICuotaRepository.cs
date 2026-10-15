using MindFit_Intelligence_Backend.Models;

namespace MindFit_Intelligence_Backend.Repository.Interfaces
{
    public interface ICuotaRepository
    {
        Task<IEnumerable<Cuota>> GetBySocio(int idUsuario);
        Task<Cuota?> GetUltimaCuotaSocio(int idUsuario);
        Task<Cuota?> GetCuotaVigente(int idUsuario);
        Task<Cuota?> GetById(int id);
        Task<IEnumerable<Cuota>> GetVencidas();
        Task Add(Cuota entity);
        void Update(Cuota entity);
        void Delete(Cuota entity);
        Task Save();
    }
}
