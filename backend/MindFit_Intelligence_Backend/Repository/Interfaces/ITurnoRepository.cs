using MindFit_Intelligence_Backend.DTOs.Turno;
using MindFit_Intelligence_Backend.Models;

namespace MindFit_Intelligence_Backend.Repository.Interfaces
{
    public interface ITurnoRepository
    {
        Task<bool> ExisteTurnoEnFecha(int idSocio, DateTime fecha);
        Task<IEnumerable<Turno>> GetSociosConTurnoHoyPorEntrenadorYHorario(int idUsuarioResponsable, int idRangoHorario, DateTime fechaActual);
        Task<IEnumerable<Turno>> GetByIdUsuarioSocio(int idUsuarioSocio);
        Task<Turno?> GetByIdWithIncludes(int idTurno);
        Task<Turno?> GetTurnoParaIngresoByDniAsync(string dniSocio, DateTime fecha);
        Task Add(Turno entity);
        Task<IEnumerable<TurnoDetalleDto>> GetTurnosDetallePorFechaAsync(DateTime fechaFiltro);
        Task Save();
        Task<List<Turno>> GetTurnosEnCurso();
    }
}
