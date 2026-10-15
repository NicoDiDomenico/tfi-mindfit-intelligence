using MindFit_Intelligence_Backend.DTOs.Reportes;

namespace MindFit_Intelligence_Backend.Services.Interfaces
{
    public interface IReporteService
    {
        Task<ReportesGimnasioDto> GetReportesGimnasio(ReporteFiltroDto filtro);
    }
}
