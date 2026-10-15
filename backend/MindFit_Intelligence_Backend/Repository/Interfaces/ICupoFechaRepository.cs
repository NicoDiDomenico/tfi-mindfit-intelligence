using MindFit_Intelligence_Backend.Models;

namespace MindFit_Intelligence_Backend.Repository.Interfaces
{
    public interface ICupoFechaRepository
    {
        Task<CupoFecha?> GetByDiaRangoHorarioYFecha(int idDiaRangoHorario, DateTime fecha);
        Task Add(CupoFecha entity);
        void Update(CupoFecha entity);
        Task Save();
    }
}
