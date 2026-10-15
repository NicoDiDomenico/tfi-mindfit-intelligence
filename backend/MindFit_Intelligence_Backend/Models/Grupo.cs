using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MindFit_Intelligence_Backend.Models
{
    [Index(nameof(Nombre), IsUnique = true)]
    public class Grupo
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int IdGrupo { get; set; }

        [Column(TypeName = "varchar(50)")]
        public string Nombre { get; set; } = string.Empty;

        [Column(TypeName = "varchar(200)")]
        public string? Descripcion { get; set; }

        // Navegaciones (N:M)
        public ICollection<UsuarioGrupo> UsuarioGrupos { get; set; } = new List<UsuarioGrupo>();
        public ICollection<GrupoPermiso> GrupoPermisos { get; set; } = new List<GrupoPermiso>();

    }
}
