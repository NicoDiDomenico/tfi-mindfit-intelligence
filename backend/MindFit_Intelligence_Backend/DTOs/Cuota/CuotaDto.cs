using MindFit_Intelligence_Backend.Models.Enums;

namespace MindFit_Intelligence_Backend.DTOs.Cuota
{
    public class CuotaDto
    {
        public int IdCuota { get; set; }
        public int IdUsuario { get; set; }
        public Plan Plan { get; set; }
        public DateTime FechaInicioPeriodo { get; set; }
        public DateTime FechaFinPeriodo { get; set; }
        public decimal Monto { get; set; }
        public EstadoCuota EstadoCuota { get; set; }
        public DateTime? FechaPago { get; set; }
    }
}
