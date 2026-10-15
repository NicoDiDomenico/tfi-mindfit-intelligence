namespace MindFit_Intelligence_Backend.DTOs.Ejercicios
{
    public class EjercicioInsertDto
    {
        public required string DescEjercicio { get; set; }
        public int IdGrupoMuscular { get; set; }
        public int IdTipoEjercicio { get; set; }
        public int? IdMaquina { get; set; }
        public int? IdEquipamiento { get; set; }
    }
}