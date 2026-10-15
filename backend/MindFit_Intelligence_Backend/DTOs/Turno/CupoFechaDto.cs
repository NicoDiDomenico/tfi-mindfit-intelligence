namespace MindFit_Intelligence_Backend.DTOs.Turno
{
    public class CupoFechaDto
    {
        public int IdCupoFecha { get; set; }
        public int IdDiaRangoHorario { get; set; }
        public DateTime Fecha { get; set; }
        public int CupoActual { get; set; }
    }
}
