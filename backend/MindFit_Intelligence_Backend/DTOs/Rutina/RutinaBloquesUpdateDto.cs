using MindFit_Intelligence_Backend.DTOs.Calentamiento;
using MindFit_Intelligence_Backend.DTOs.Entrenamiento;
using MindFit_Intelligence_Backend.DTOs.Estiramiento;

namespace MindFit_Intelligence_Backend.DTOs.Rutina
{
    public class RutinaBloquesUpdateDto
    {
        public List<CalentamientoInsertDto> Calentamientos { get; set; } = new();
        public List<EntrenamientoInsertDto> Entrenamientos { get; set; } = new();
        public List<EstiramientoInsertDto> Estiramientos { get; set; } = new();
    }
}
