using MindFit_Intelligence_Backend.DTOs.Personas;

namespace MindFit_Intelligence_Backend.Services.Interfaces
{
    public interface IPersonaResponsableService : IPersonaService<PersonaResponsableDto>
    {
        Task<IEnumerable<EntrenadorDto>> GetEntrenadores();
        Task<IEnumerable<EntrenadorDto>> GetEntrenadoresPorHorario(int idRangoHorario);
    }
}
