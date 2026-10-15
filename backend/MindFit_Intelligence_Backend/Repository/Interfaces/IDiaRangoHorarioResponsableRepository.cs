using MindFit_Intelligence_Backend.Models;

namespace MindFit_Intelligence_Backend.Repository.Interfaces
{
    public interface IDiaRangoHorarioResponsableRepository
    {
        Task<DiaRangoHorarioResponsable?> GetByIds(int idDiaRangoHorario, int idUsuarioResponsable);
        Task Add(DiaRangoHorarioResponsable responsable);
        Task Remove(DiaRangoHorarioResponsable responsable);
        Task Save();
    }
}
