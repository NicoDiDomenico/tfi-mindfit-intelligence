namespace MindFit_Intelligence_Backend.DTOs.Usuarios
{
    public class ProcesarEliminacionesDto
    {
        public int SociosElimidados { get; set; }
        public List<int> IdsProcesados { get; set; } = new();
        public string Mensaje { get; set; } = string.Empty;
        public DateTime FechaEjecucion { get; set; } = DateTime.UtcNow;
    }
}
