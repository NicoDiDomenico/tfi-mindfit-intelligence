using MindFit_Intelligence_Backend.Models;

namespace MindFit_Intelligence_Backend.Repository.Interfaces
{
    public interface IRutinaRepository
    {
        Task<Rutina?> GetRutinaPorSocioYDia(int idUsuarioSocio, int? idDia, string? nombreDia);
        Task<Rutina?> ReemplazarBloquesRutina(int idRutina, List<Calentamiento> calentamientos, List<Entrenamiento> entrenamientos, List<Estiramiento> estiramientos);
        Task<Rutina?> CambiarEstadoRutina(int idRutina, bool activo);
        Task<List<RutinaHistorial>> GetHistorialByRutina(int idRutina);
        Task<RutinaHistorial?> GetHistorialDetalle(int idRutina, int idRutinaHistorial);
        Task<Rutina?> RestaurarRutinaDesdeHistorial(int idRutina, int idRutinaHistorial);
    }
}
