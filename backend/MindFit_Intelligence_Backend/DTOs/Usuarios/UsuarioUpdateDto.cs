using MindFit_Intelligence_Backend.DTOs.Grupos;
using MindFit_Intelligence_Backend.DTOs.Personas;

namespace MindFit_Intelligence_Backend.DTOs.Usuarios
{
    public class UsuarioUpdateDto
    {
        public string Username { get; set; } = string.Empty;
        public string TipoPersona { get; set; } = ""; // "Responsable" | "Socio"
        public PersonaResponsableUpdateDto? PersonaResponsable { get; set; }
        public PersonaSocioUpdateDto? PersonaSocio { get; set; }
        public List<int>? IdGrupos { get; set; }
    }
}
