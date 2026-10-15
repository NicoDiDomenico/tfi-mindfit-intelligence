using MindFit_Intelligence_Backend.Models.Enums;

namespace MindFit_Intelligence_Backend.DTOs.TipoEjercicio
{
    public class TipoEjercicioDto
    {
        public int IdTipoEjercicio { get; set; }
        public required TipoDeEjercicio NombreTipo { get; set; }
    }
}