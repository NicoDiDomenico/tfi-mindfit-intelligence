using MindFit_Intelligence_Backend.DTOs.Calentamiento;
using MindFit_Intelligence_Backend.DTOs.Entrenamiento;
using MindFit_Intelligence_Backend.DTOs.Estiramiento;

namespace MindFit_Intelligence_Backend.DTOs.Rutina
{
    public class RutinaDto
    {
        public int IdRutina { get; set; }

        public int IdPersonaSocio { get; set; }
        public int IdDia { get; set; }

        public DateTime FechaModificacion { get; set; }

        public bool Activo { get; set; }

        public List<CalentamientoDto> Calentamientos { get; set; } = new();

        public List<EntrenamientoDto> Entrenamientos { get; set; } = new();

        public List<EstiramientoDto> Estiramientos { get; set; } = new();
    }
}
