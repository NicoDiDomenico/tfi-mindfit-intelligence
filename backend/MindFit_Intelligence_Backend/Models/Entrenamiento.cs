using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MindFit_Intelligence_Backend.Models
{
    public class Entrenamiento
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int IdEntrenamiento { get; set; }

        [ForeignKey(nameof(Rutina))]
        public int IdRutina { get; set; }
        public Rutina Rutina { get; set; } = default!;

        [ForeignKey(nameof(Ejercicio))]
        public int IdEjercicio { get; set; }
        public Ejercicio Ejercicio { get; set; } = default!;

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
