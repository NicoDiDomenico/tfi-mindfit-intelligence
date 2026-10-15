namespace MindFit_Intelligence_Backend.DTOs.RangoHorario
{
    public class RangoHorarioDto
    {
        public int IdRangoHorario { get; set; }
        public TimeSpan HoraDesde { get; set; }
        public TimeSpan HoraHasta { get; set; }
    }
}
