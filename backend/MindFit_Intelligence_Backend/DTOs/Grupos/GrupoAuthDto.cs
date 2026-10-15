using MindFit_Intelligence_Backend.DTOs.Permisos;

namespace MindFit_Intelligence_Backend.DTOs.Grupos
{
    public class GrupoAuthDto
    {
        public int IdGrupo { get; set; }
        public string NombreGrupo { get; set; } = string.Empty;
        public List<PermisoAuthDto> Permisos { get; set; } = new();
    }
}
