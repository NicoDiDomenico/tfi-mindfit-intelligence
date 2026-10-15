using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MindFit_Intelligence_Backend.Models
{
    public class Maquina
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int IdMaquina { get; set; }

        [Column(TypeName = "VARCHAR(50)")]
        public required string NombreMaquina { get; set; }

        public DateTime FechaFabricacion { get; set; }
        public DateTime FechaCompra { get; set; }

        [Column(TypeName = "DECIMAL(18,2)")]
        public decimal CostoAdquisicion { get; set; }

        [Column(TypeName = "DECIMAL(18,2)")]
        public decimal? PesoMaximoLingotera { get; set; }

        public bool EsElectrica { get; set; }
    }
}
