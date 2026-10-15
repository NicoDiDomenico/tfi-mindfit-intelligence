using MindFit_Intelligence_Backend.Models;

namespace MindFit_Intelligence_Backend.Repository.Interfaces
{
    public interface IPersonaResponsableRepository : ICommonRepository<PersonaResponsable>
    {
        Task<PersonaResponsable?> GetByEmail(string email);
        Task<IEnumerable<PersonaResponsable>> GetEntrenadores();
        Task<IEnumerable<PersonaResponsable>> GetEntrenadoresPorHorario(int idRangoHorario, string nombreDia);
    }
}
