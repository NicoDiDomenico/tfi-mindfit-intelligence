using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MindFit_Intelligence_Backend.Models
{
    public class Equipamiento
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int IdEquipamiento { get; set; }

        [Column(TypeName = "VARCHAR(50)")]
        public required string NombreEquipo { get; set; }

        [Column(TypeName = "DECIMAL(18,2)")]
        public decimal CostoAdquisicion { get; set; }

        [Column(TypeName = "DECIMAL(18,2)")]
        public decimal? PesoFijoKg { get; set; }
    }
}
