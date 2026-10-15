namespace MindFit_Intelligence_Backend.DTOs.Reportes
{
    public class ReportesResumenDto
    {
        public int TotalReservas { get; set; }
        public decimal PromedioOcupacion { get; set; }
        public string? HorarioMasDemandado { get; set; }
        public string? HorarioMenosUtilizado { get; set; }
        public int SociosRiesgoAlto { get; set; }
        public int SociosRiesgoMedio { get; set; }
        public int SociosSinRutinaActiva { get; set; }
        public decimal IngresoCuotasMesActual { get; set; }
    }
}
