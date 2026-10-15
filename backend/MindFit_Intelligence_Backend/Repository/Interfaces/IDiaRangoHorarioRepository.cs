using MindFit_Intelligence_Backend.Models;

namespace MindFit_Intelligence_Backend.Repository.Interfaces
{
    public interface IDiaRangoHorarioRepository
    {
        Task<IEnumerable<DiaRangoHorario>> GetAll();
        Task<IEnumerable<DiaRangoHorario>> GetByNombreDia(string nombreDia);
        Task<DiaRangoHorario?> GetById(int id);
        Task Save();
    }
}
