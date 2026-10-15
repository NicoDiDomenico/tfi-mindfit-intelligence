namespace MindFit_Intelligence_Backend.DTOs.Entrenamiento
{
    public class EntrenamientoInsertDto
    {
        public int IdEjercicio { get; set; }
        public int Series { get; set; }
        public int Repeticiones { get; set; }
        public decimal? PesoAsignado { get; set; }
        public int? TiempoDescansoSegundos { get; set; }
        public int Orden { get; set; }
        public string? Observaciones { get; set; }
    }
}
