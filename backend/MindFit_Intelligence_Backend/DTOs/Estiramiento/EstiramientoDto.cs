using MindFit_Intelligence_Backend.DTOs.Ejercicios;

namespace MindFit_Intelligence_Backend.DTOs.Estiramiento
{
    public class EstiramientoDto
    {
        public int IdEstiramiento { get; set; }
        public int IdRutina { get; set; }
        public EjercicioDto Ejercicio { get; set; } = default!;
        public int Duracion { get; set; }
        public int Orden { get; set; }
        public string? Observaciones { get; set; }
    }
}
