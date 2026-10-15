using MindFit_Intelligence_Backend.DTOs.Auditoria;
using MindFit_Intelligence_Backend.Models;

namespace MindFit_Intelligence_Backend.Repository.Interfaces
{
    public interface IAuditoriaRepository
    {
        Task AddEventoAsync(AuditoriaEvento evento);
        Task AddSesionAsync(AuditoriaSesion sesion);
        Task SaveAsync();
        Task<(List<AuditoriaEvento> Items, int Total)> GetEventosAsync(AuditoriaEventoFiltroDto filtro);
        Task<AuditoriaEvento?> GetEventoByIdAsync(int idAuditoriaEvento);
        Task<(List<AuditoriaSesion> Items, int Total)> GetSesionesAsync(AuditoriaSesionFiltroDto filtro);
        Task<int> CountEventosAsync(DateTime? fechaDesde, DateTime? fechaHasta);
        Task<int> CountSesionesAsync(DateTime? fechaDesde, DateTime? fechaHasta);
        Task<List<AuditoriaResumenItemDto>> GetEventosPorAccionAsync(DateTime? fechaDesde, DateTime? fechaHasta);
        Task<List<AuditoriaResumenItemDto>> GetSesionesPorTipoAsync(DateTime? fechaDesde, DateTime? fechaHasta);
    }
}
