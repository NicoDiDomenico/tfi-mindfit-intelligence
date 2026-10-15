using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MindFit_Intelligence_Backend.Models
{
    [Index(nameof(HoraDesde), nameof(HoraHasta), IsUnique = true)]
    public class RangoHorario
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int IdRangoHorario { get; set; }

        [Column(TypeName = "time")]
        public TimeSpan HoraDesde { get; set; }

        [Column(TypeName = "time")]
        public TimeSpan HoraHasta { get; set; }

        public ICollection<DiaRangoHorario> DiaRangosHorarios { get; set; } = new List<DiaRangoHorario>();
    }
}
