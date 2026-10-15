using MindFit_Intelligence_Backend.Models.Enums;

namespace MindFit_Intelligence_Backend.DTOs.GrupoMuscular
{
    public class GrupoMuscularDto
    {
        public int IdGrupoMuscular { get; set; }
        public required Musculo NombreMusculo { get; set; }
        public string? IdMapaAnatomico { get; set; }
    }
}