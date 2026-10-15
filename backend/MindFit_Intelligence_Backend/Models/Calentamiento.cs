using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MindFit_Intelligence_Backend.Models
{
    public class Calentamiento
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int IdCalentamiento { get; set; }

        [ForeignKey(nameof(Rutina))]
        public int IdRutina { get; set; }
        public Rutina Rutina { get; set; } = default!;

        [ForeignKey(nameof(Ejercicio))]
        public int IdEjercicio { get; set; }
        public Ejercicio Ejercicio { get; set; } = default!;

        public int Duracion { get; set; }
        public int Orden { get; set; }

        [Column(TypeName = "VARCHAR(200)")]
        public string? Observaciones { get; set; }
    }
}
