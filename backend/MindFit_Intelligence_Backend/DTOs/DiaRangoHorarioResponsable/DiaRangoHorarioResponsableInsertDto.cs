namespace MindFit_Intelligence_Backend.DTOs.DiaRangoHorarioResponsable
{
    public class DiaRangoHorarioResponsableInsertDto
    {
        public int IdDiaRangoHorario { get; set; }
        public int IdUsuarioResponsable { get; set; } // En este caso, el "responsable" es un "entrenador".
        public string? Observaciones { get; set; }
    }
}
