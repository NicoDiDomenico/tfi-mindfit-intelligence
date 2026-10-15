using MindFit_Intelligence_Backend.DTOs.Permisos;

namespace MindFit_Intelligence_Backend.DTOs.Grupos
{
    public class GrupoDto
    {
        public int IdGrupo { get; set; }
        public string Nombre { get; set; } = string.Empty;
        public string Descripcion { get; set; } = string.Empty;
        public List<PermisoDto> Permisos { get; set; } = new();
    }
}
