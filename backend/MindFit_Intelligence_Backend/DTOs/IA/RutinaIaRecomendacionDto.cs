using MindFit_Intelligence_Backend.DTOs.Rutina;

namespace MindFit_Intelligence_Backend.DTOs.IA
{
    public class RutinaIaRecomendacionDto
    {
        public string Resumen { get; set; } = string.Empty;
        public List<string> Criterios { get; set; } = new();
        public List<string> Advertencias { get; set; } = new();
        public RutinaBloquesUpdateDto Propuesta { get; set; } = new();
    }
}
