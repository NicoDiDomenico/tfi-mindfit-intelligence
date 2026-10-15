using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MindFit_Intelligence_Backend.Models
{
    public class Ejercicio
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int IdEjercicio { get; set; }

        [Column(TypeName = "VARCHAR(100)")]
        public required string DescEjercicio { get; set; }

        [ForeignKey(nameof(GrupoMuscular))]
        public int IdGrupoMuscular { get; set; }
        public GrupoMuscular GrupoMuscular { get; set; } = default!;

        [ForeignKey(nameof(TipoEjercicio))]
        public int IdTipoEjercicio { get; set; }
        public TipoEjercicio TipoEjercicio { get; set; } = default!;

        [ForeignKey(nameof(Maquina))]
        public int? IdMaquina { get; set; }
        public Maquina? Maquina { get; set; }

        [ForeignKey(nameof(Equipamiento))]
        public int? IdEquipamiento { get; set; }
        public Equipamiento? Equipamiento { get; set; }
    }
}
