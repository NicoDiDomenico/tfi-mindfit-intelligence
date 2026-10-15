using MindFit_Intelligence_Backend.DTOs.Auditoria;
using MindFit_Intelligence_Backend.Models;
using MindFit_Intelligence_Backend.Services.Auditoria;

namespace MindFit_Intelligence_Backend.Services.Interfaces
{
    public interface IAuditoriaService
    {
        RutinaAuditoriaSnapshot? CrearSnapshotRutina(Rutina? rutina);
        string? SerializarSnapshot(RutinaAuditoriaSnapshot? snapshot);
        string? CrearCambiosRutinaJson(RutinaAuditoriaSnapshot? original, RutinaAuditoriaSnapshot? nuevo);
        Task RegistrarEventoRutinaAsync(
            int idRutina,
            string accion,
            RutinaAuditoriaSnapshot? original,
            RutinaAuditoriaSnapshot? nuevo,
            string resultado = "Exitoso",
            string? mensaje = null);
        Task RegistrarSesionAsync(
            string tipoEvento,
            string resultado,
            string? usernameIntentado,
            int? idUsuario = null,
            string? motivoFallo = null);
        Task<AuditoriaResultadoDto<AuditoriaEventoDto>> GetEventos(AuditoriaEventoFiltroDto filtro);
        Task<AuditoriaEventoDto?> GetEventoById(int idAuditoriaEvento);
        Task<AuditoriaResultadoDto<AuditoriaSesionDto>> GetSesiones(AuditoriaSesionFiltroDto filtro);
        Task<AuditoriaReporteResumenDto> GetResumen(DateTime? fechaDesde, DateTime? fechaHasta);
    }
}
