namespace MindFit_Intelligence_Backend.DTOs.Reportes
{
    public class FlujoReservasProfesorDto
    {
        public string Dia { get; set; } = string.Empty;
        public int IdUsuarioResponsable { get; set; }
        public string Profesor { get; set; } = string.Empty;
        public string EstadoTurno { get; set; } = string.Empty;
        public int Cantidad { get; set; }
    }
}
