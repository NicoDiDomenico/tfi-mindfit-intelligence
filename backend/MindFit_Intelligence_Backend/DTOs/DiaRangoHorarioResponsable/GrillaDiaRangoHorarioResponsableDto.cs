namespace MindFit_Intelligence_Backend.DTOs.DiaRangoHorarioResponsable
{
    public class GrillaDiaRangoHorarioResponsableDto
    {
        public int IdUsuarioResponsable { get; set; }
        public string Nombre { get; set; } = null!;
        public string Apellido { get; set; } = null!;
        public string? Observaciones { get; set; }
    }
}
