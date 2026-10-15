using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MindFit_Intelligence_Backend.Models
{
    [Index(nameof(NombreFormulario), IsUnique = true)]
    public class Formulario
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int IdFormulario { get; set; }

        [Column(TypeName = "varchar(100)")]
        public string NombreFormulario { get; set; } = string.Empty;

        public required ICollection<FormularioPermiso> FormularioPermisos { get; set; }
    }
}
