using Microsoft.EntityFrameworkCore;

namespace MindFit_Intelligence_Backend.Models
{
    [PrimaryKey(nameof(IdUsuario), nameof(IdGrupo))]
    public class UsuarioGrupo
    {
        public int IdUsuario { get; set; }
        public int IdGrupo { get; set; }

        // Navegaciones
        public Usuario Usuario { get; set; } = null!;
        public Grupo Grupo { get; set; } = null!;
    }
}
