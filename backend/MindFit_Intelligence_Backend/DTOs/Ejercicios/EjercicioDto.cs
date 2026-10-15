using MindFit_Intelligence_Backend.DTOs.Maquinas;
using MindFit_Intelligence_Backend.DTOs.Equipamientos;
using MindFit_Intelligence_Backend.DTOs.GrupoMuscular;
using MindFit_Intelligence_Backend.DTOs.TipoEjercicio;
using MindFit_Intelligence_Backend.Models.Enums;

namespace MindFit_Intelligence_Backend.DTOs.Ejercicios
{
    public class EjercicioDto
    {
        public int IdEjercicio { get; set; }
        public required string DescEjercicio { get; set; }
        public GrupoMuscularDto GrupoMuscular { get; set; } = default!;
        public TipoEjercicioDto TipoEjercicio { get; set; } = default!;
        public MaquinaDto? Maquina { get; set; }
        public EquipamientoDto? Equipamiento { get; set; }
    }
}