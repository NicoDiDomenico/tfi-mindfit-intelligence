using MindFit_Intelligence_Backend.Models.Enums;

namespace MindFit_Intelligence_Backend.DTOs.Cuota
{
    public class CuotaInsertDto
    {
        public Plan Plan { get; set; }
        public decimal Monto { get; set; }
    }
}
