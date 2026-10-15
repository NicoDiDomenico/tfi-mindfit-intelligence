using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using MindFit_Intelligence_Backend.Models.Enums;

namespace MindFit_Intelligence_Backend.Models
{
    public class TipoEjercicio
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int IdTipoEjercicio { get; set; }

        [Column(TypeName = "VARCHAR(50)")]
        public required TipoDeEjercicio NombreTipo { get; set; }
        public ICollection<Ejercicio> Ejercicios { get; set; } = new List<Ejercicio>();
    }
}
