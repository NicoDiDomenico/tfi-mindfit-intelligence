using MindFit_Intelligence_Backend.Models.Enums;

namespace MindFit_Intelligence_Backend.DTOs.Turno
{
    public class TurnoDto
    {
        public int IdTurno { get; set; }
        public DateTime FechaAlta { get; set; }
        public EstadoTurno EstadoTurno { get; set; }
        public TimeSpan HoraDesde { get; set; }
        public TimeSpan HoraHasta { get; set; }
        public string NombreDia { get; set; } = null!;
        public string NombreResponsable { get; set; } = null!;
        public string ApellidoResponsable { get; set; } = null!;
    }
}
