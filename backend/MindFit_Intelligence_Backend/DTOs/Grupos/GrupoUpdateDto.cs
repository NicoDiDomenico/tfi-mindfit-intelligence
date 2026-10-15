using MindFit_Intelligence_Backend.DTOs.Permisos;

namespace MindFit_Intelligence_Backend.DTOs.Grupos
{
    public class GrupoUpdateDto
    {
        public string Nombre { get; set; } = string.Empty;
        public string Descripcion { get; set; } = string.Empty;
        public List<int> IdPermisos { get; set; } = new();
    }
}
