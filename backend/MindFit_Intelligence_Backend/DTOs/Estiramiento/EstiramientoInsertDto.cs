namespace MindFit_Intelligence_Backend.DTOs.Estiramiento
{
    public class EstiramientoInsertDto
    {
        public int IdEjercicio { get; set; }
        public int Duracion { get; set; }
        public int Orden { get; set; }
        public string? Observaciones { get; set; }
    }
}
