using MindFit_Intelligence_Backend.Models;

namespace MindFit_Intelligence_Backend.Repository.Interfaces
{
    public interface IEjercicioRepository : ICommonRepository<Ejercicio>
    {
        Task<IEnumerable<Ejercicio>> GetByGrupoMuscularId(int idGrupoMuscular);
    }
}