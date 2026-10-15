namespace MindFit_Intelligence_Backend.DTOs.Reportes
{
    public class OcupacionHorariaDto
    {
        public string Dia { get; set; } = string.Empty;
        public string RangoHorario { get; set; } = string.Empty;
        public int CupoMaximo { get; set; }
        public int Reservas { get; set; }
        public int Finalizados { get; set; }
        public int Cancelados { get; set; }
        public int Vencidos { get; set; }
        public decimal PorcentajeOcupacion { get; set; }
        public string NivelDemanda { get; set; } = string.Empty;
    }
}
