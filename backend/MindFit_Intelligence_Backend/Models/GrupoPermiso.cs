using Microsoft.EntityFrameworkCore;

namespace MindFit_Intelligence_Backend.Models
{
    [PrimaryKey(nameof(IdGrupo), nameof(IdPermiso))]
    public class GrupoPermiso
    {
        public int IdGrupo { get; set; }
        public int IdPermiso { get; set; }

        // Navegaciones
        public Grupo Grupo { get; set; } = null!;
        public Permiso Permiso { get; set; } = null!;
    }
}
