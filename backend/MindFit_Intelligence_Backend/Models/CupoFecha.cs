using Microsoft.EntityFrameworkCore;
using System.Collections.ObjectModel;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MindFit_Intelligence_Backend.Models
{
    [Index(nameof(IdDiaRangoHorario), nameof(Fecha), IsUnique = true)]
    public class CupoFecha
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int IdCupoFecha { get; set; }

        [ForeignKey(nameof(DiaRangoHorario))]
        public int IdDiaRangoHorario { get; set; }

        public DiaRangoHorario DiaRangoHorario { get; set; } = null!;

        [Column(TypeName = "date")]
        public DateTime Fecha { get; set; }

        public int CupoActual { get; set; }

        public ICollection<Turno> Turnos { get; set; } = new Collection<Turno>();

        public bool TieneDisponibilidad() => CupoActual < DiaRangoHorario.CupoMaximo;

        public void IncrementarCupo() => CupoActual++;
        public void DecrementarCupo()
        {
            if (CupoActual > 0)
                CupoActual--;
        }
    }
}
