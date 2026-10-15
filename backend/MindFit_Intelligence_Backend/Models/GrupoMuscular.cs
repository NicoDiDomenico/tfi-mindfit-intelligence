using MindFit_Intelligence_Backend.Models.Enums;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MindFit_Intelligence_Backend.Models
{
    public class GrupoMuscular
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int IdGrupoMuscular { get; set; }

        [Column(TypeName = "VARCHAR(50)")]
        public required Musculo NombreMusculo { get; set; }

        [Column(TypeName = "VARCHAR(50)")]
        public string? IdMapaAnatomico { get; set; }

        public ICollection<Ejercicio> Ejercicios { get; set; } = new List<Ejercicio>();
    }
}
