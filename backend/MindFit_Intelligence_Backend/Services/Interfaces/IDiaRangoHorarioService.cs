using MindFit_Intelligence_Backend.DTOs.DiaRangoHorario;
using MindFit_Intelligence_Backend.DTOs.DiaRangoHorarioResponsable;

namespace MindFit_Intelligence_Backend.Services.Interfaces
{
    public interface IDiaRangoHorarioService
    {
        Task<IEnumerable<GrillaDiaRangoHorarioDto>> GetAll();
        Task<IEnumerable<GrillaDiaRangoHorarioDto>> GetByFecha(DateTime fecha);
        Task<bool> ActivarDesactivarHorario(int IdDiaRangoHorario, DiaRangoHorarioUpdateDto dto);
        Task<bool> AsignarResponsable(DiaRangoHorarioResponsableInsertDto dto);
        Task<bool> ActualizarResponsable(DiaRangoHorarioResponsableUpdateDto dto);
        Task<bool> QuitarResponsable(DiaRangoHorarioResponsableDeleteDto dto);
        List<string> Errors { get; }
    }
}
