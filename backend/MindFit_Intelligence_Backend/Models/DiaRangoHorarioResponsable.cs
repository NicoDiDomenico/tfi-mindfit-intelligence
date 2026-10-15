using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MindFit_Intelligence_Backend.Models
{
    [Index(nameof(IdDiaRangoHorario), nameof(IdUsuarioResponsable), IsUnique = true)]
    public class DiaRangoHorarioResponsable
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int IdDiaRangoHorarioResponsable { get; set; }

        [ForeignKey(nameof(DiaRangoHorario))]
        public int IdDiaRangoHorario { get; set; }

        public DiaRangoHorario DiaRangoHorario { get; set; } = null!;

        [ForeignKey(nameof(PersonaResponsable))]
        public int IdUsuarioResponsable { get; set; }

        public PersonaResponsable PersonaResponsable { get; set; } = null!;

        [Column(TypeName = "varchar(255)")]
        public string? Observaciones { get; set; }
    }
}
