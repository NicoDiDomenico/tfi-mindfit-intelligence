using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MindFit_Intelligence_Backend.Models
{
    public class RutinaHistorial
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int IdRutinaHistorial { get; set; }

        [ForeignKey(nameof(Rutina))]
        public int IdRutina { get; set; }
        public Rutina Rutina { get; set; } = null!;

        public int Version { get; set; }
        public DateTime FechaSnapshot { get; set; }
        public bool ActivoSnapshot { get; set; }
        public int? IdUsuarioAccion { get; set; }
        public string? Accion { get; set; }
        public DateTime? FechaAccionUtc { get; set; }
        public string? ValoresNuevosJson { get; set; }
        public string? CambiosJson { get; set; }

        public ICollection<RutinaHistorialCalentamiento> Calentamientos { get; set; } = new List<RutinaHistorialCalentamiento>();
        public ICollection<RutinaHistorialEntrenamiento> Entrenamientos { get; set; } = new List<RutinaHistorialEntrenamiento>();
        public ICollection<RutinaHistorialEstiramiento> Estiramientos { get; set; } = new List<RutinaHistorialEstiramiento>();
    }
}
