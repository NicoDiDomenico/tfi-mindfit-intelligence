using MindFit_Intelligence_Backend.DTOs.SocioInsights;

namespace MindFit_Intelligence_Backend.Services.Interfaces
{
    public interface ISocioInsightsService
    {
        Task<IEnumerable<SocioRecomendacionDto>> GetRecomendaciones(int idUsuarioSocio);
    }
}
