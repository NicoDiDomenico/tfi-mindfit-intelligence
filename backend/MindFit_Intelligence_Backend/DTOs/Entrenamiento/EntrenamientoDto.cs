using MindFit_Intelligence_Backend.DTOs.Ejercicios;

namespace MindFit_Intelligence_Backend.DTOs.Entrenamiento
{
    public class EntrenamientoDto
    {
        public int IdEntrenamiento { get; set; }
        public int IdRutina { get; set; }
        public EjercicioDto Ejercicio { get; set; } = default!;
        public int Series { get; set; }
        public int Repeticiones { get; set; }
        public decimal? PesoAsignado { get; set; }
        public int? TiempoDescansoSegundos { get; set; }
        public int Orden { get; set; }
        public string? Observaciones { get; set; }
    }
}
