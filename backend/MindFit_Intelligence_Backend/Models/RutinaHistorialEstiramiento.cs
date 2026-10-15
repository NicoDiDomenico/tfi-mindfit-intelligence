using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MindFit_Intelligence_Backend.Models
{
    public class RutinaHistorialEstiramiento
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int IdRutinaHistorialEstiramiento { get; set; }

        [ForeignKey(nameof(RutinaHistorial))]
        public int IdRutinaHistorial { get; set; }
        public RutinaHistorial RutinaHistorial { get; set; } = null!;

        public int IdEjercicio { get; set; }
        public int Duracion { get; set; }
        public int Orden { get; set; }

        [Column(TypeName = "VARCHAR(200)")]
        public string? Observaciones { get; set; }
    }
}
