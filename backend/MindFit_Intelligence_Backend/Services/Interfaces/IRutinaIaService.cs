using MindFit_Intelligence_Backend.DTOs.IA;

namespace MindFit_Intelligence_Backend.Services.Interfaces
{
    public enum RutinaIaErrorType
    {
        None,
        NotFound,
        Validation,
        Configuration,
        ExternalService
    }

    public interface IRutinaIaService
    {
        List<string> Errors { get; }
        RutinaIaErrorType LastErrorType { get; }

        Task<RutinaIaRecomendacionDto?> GenerarRecomendacion(
            int idRutina,
            RutinaIaRecomendacionRequestDto requestDto);
    }
}
