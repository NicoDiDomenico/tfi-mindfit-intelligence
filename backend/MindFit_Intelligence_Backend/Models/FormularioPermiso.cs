using Microsoft.EntityFrameworkCore;

namespace MindFit_Intelligence_Backend.Models
{
    [PrimaryKey(nameof(IdFormulario), nameof(IdPermiso))]
    public class FormularioPermiso
    {
        public int IdFormulario { get; set; }
        public int IdPermiso { get; set; }

        public Formulario Formulario { get; set; } = null!;
        public Permiso Permiso { get; set; } = null!;
    }
}
