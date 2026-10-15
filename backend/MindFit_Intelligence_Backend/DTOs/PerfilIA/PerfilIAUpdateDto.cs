namespace MindFit_Intelligence_Backend.DTOs.PerfilIA
{
    public class PerfilIAUpdateDto
    {
        public string? ObjetivoPrincipal { get; set; }
        public string? NivelExperiencia { get; set; }
        public string? EjerciciosPreferidos { get; set; }
        public string? EjerciciosAEvitar { get; set; }
        public string? DisponibilidadHoraria { get; set; }
        public string? MotivacionPersonal { get; set; }
        public string? LesionesLimitaciones { get; set; }
        public string? CondicionesMedicasRelevantes { get; set; }
        public string? IntensidadPreferida { get; set; }
        public int? DuracionSesionMinutos { get; set; }
        public string? NotasEntrenador { get; set; }
        public string? PlanAlimenticio { get; set; }
        public DateTime? FechaActualizacion { get; set; }
    }
}
