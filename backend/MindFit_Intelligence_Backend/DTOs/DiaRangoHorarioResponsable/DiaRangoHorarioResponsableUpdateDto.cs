namespace MindFit_Intelligence_Backend.DTOs.DiaRangoHorarioResponsable
{
    public class DiaRangoHorarioResponsableUpdateDto
    {
        public int IdDiaRangoHorario { get; set; }
        public int IdUsuarioResponsable { get; set; }
        public string? Observaciones { get; set; } = null;
    }
}
