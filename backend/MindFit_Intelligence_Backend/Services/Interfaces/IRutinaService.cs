using MindFit_Intelligence_Backend.DTOs.Rutina;

namespace MindFit_Intelligence_Backend.Services.Interfaces
{
    public interface IRutinaService
    {
        Task<RutinaDto?> GetRutinaPorSocioYDia(int idUsuarioSocio, int? idDia);
        Task<RutinaDto?> ReemplazarBloquesRutina(int idRutina, RutinaBloquesUpdateDto bloquesDto);
        Task<RutinaDto?> CambiarEstadoRutina(int idRutina, bool activo);
        Task<IEnumerable<RutinaHistorialResumenDto>> GetHistorialByRutina(int idRutina);
        Task<RutinaHistorialDetalleDto?> GetHistorialDetalle(int idRutina, int idRutinaHistorial);
        Task<RutinaDto?> RestaurarRutinaDesdeHistorial(int idRutina, int idRutinaHistorial);
    }
}
