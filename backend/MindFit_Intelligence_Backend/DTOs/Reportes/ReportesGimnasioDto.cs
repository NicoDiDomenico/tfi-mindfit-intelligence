namespace MindFit_Intelligence_Backend.DTOs.Reportes
{
    public class ReportesGimnasioDto
    {
        public ReportesResumenDto Resumen { get; set; } = new();
        public List<OcupacionHorariaDto> OcupacionHoraria { get; set; } = new();
        public List<SocioRiesgoDto> SociosRiesgo { get; set; } = new();
        public List<SocioRiesgoDto> SociosSeguimiento { get; set; } = new();
        public List<FlujoReservasProfesorDto> FlujoReservasProfesor { get; set; } = new();
    }
}
