using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MindFit_Intelligence_Backend.Models
{
    [Index(nameof(Codigo), IsUnique = true)]
    public class Permiso
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int IdPermiso { get; set; }

        [Column(TypeName = "varchar(80)")]
        public string Codigo { get; set; } = string.Empty;

        [Column(TypeName = "varchar(200)")]
        public string? Descripcion { get; set; }

        // Navegación (N:M)
        public required ICollection<GrupoPermiso> GrupoPermisos { get; set; }
        public required ICollection<FormularioPermiso> FormularioPermisos { get; set; }
    }
}
