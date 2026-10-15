namespace MindFit_Intelligence_Backend.DTOs.Turno
{
    public class TurnoInsertDto
    {
        public int IdUsuarioResponsable { get; set; }
        public int IdUsuarioSocio { get; set; }
        public DateTime Fecha { get; set; }
        public int IdDiaRangoHorario { get; set; }
    }
}
