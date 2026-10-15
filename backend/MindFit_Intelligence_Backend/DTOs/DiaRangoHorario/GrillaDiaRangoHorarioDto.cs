using MindFit_Intelligence_Backend.DTOs.DiaRangoHorarioResponsable;

namespace MindFit_Intelligence_Backend.DTOs.DiaRangoHorario
{
    public class GrillaDiaRangoHorarioDto
    {
        public int IdDiaRangoHorario { get; set; }
        public int CupoActual { get; set; }

        public int CupoMaximo { get; set; }

        public bool Activo { get; set; }

        public TimeSpan HoraDesde { get; set; }
        public TimeSpan HoraHasta { get; set; }

        public string NombreDia { get; set; } = null!;

        public List<GrillaDiaRangoHorarioResponsableDto> Responsables { get; set; } = new List<GrillaDiaRangoHorarioResponsableDto>();
    }
}
