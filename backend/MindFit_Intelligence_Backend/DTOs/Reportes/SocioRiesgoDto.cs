namespace MindFit_Intelligence_Backend.DTOs.Reportes
{
    public class SocioRiesgoDto
    {
        public int IdUsuarioSocio { get; set; }
        public string NombreCompleto { get; set; } = string.Empty;
        public string EstadoSocio { get; set; } = string.Empty;
        public string? EstadoUltimaCuota { get; set; }
        public DateTime? FechaFinUltimaCuota { get; set; }
        public DateTime? UltimoTurno { get; set; }
        public int? DiasSinAsistir { get; set; }
        public int TurnosFinalizadosPeriodo { get; set; }
        public int TurnosCanceladosOVencidosPeriodo { get; set; }
        public int RutinasActivas { get; set; }
        public decimal MontoUltimaCuotaVencida { get; set; }
        public string NivelRiesgo { get; set; } = string.Empty;
        public string Recomendacion { get; set; } = string.Empty;
    }
}
