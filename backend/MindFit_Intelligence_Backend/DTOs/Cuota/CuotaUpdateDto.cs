using MindFit_Intelligence_Backend.Models.Enums;

namespace MindFit_Intelligence_Backend.DTOs.Cuota
{
    public class CuotaUpdateDto
    {

        public bool renueva { get; set; }
        public Plan? Plan { get; set; }
        public decimal? Monto { get; set; }
    }
}
