using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MindFit_Intelligence_Backend.Models
{
    public class RutinaHistorialEntrenamiento
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int IdRutinaHistorialEntrenamiento { get; set; }

        [ForeignKey(nameof(RutinaHistorial))]
        public int IdRutinaHistorial { get; set; }
        public RutinaHistorial RutinaHistorial { get; set; } = null!;

        public int IdEjercicio { get; set; }
        public int Series { get; set; }
        public int Repeticiones { get; set; }

        [Column(TypeName = "DECIMAL(18,2)")]
        public decimal? PesoAsignado { get; set; }

        public int? TiempoDescansoSegundos { get; set; }
        public int Orden { get; set; }

        [Column(TypeName = "VARCHAR(200)")]
        public string? Observaciones { get; set; }
    }
}
