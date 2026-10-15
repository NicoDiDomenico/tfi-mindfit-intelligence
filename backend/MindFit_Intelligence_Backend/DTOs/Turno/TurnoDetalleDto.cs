namespace MindFit_Intelligence_Backend.DTOs.Turno
{
    public class TurnoDetalleDto
    {
        public int IdTurno { get; set; }
        public string NombreDia { get; set; } = string.Empty;
        public DateTime Fecha { get; set; }
        public string Cupos { get; set; } = string.Empty;
        public string Hora { get; set; } = string.Empty;
        public string Entrenador { get; set; } = string.Empty;
        public string Socio { get; set; } = string.Empty;
        public string EstadoTurno { get; set; } = string.Empty;
    }
}
