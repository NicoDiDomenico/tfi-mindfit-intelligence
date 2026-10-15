using MindFit_Intelligence_Backend.DTOs.Grupos;
using MindFit_Intelligence_Backend.DTOs.Personas;

namespace MindFit_Intelligence_Backend.DTOs.Usuarios
{
    public class UsuarioDto
    {
        public int IdUsuario { get; set; }
        public string Username { get; set; } = string.Empty;
        public DateTime FechaRegistro { get; set; }

        public string TipoPersona { get; set; } = ""; // "Responsable" | "Socio"

        public PersonaResponsableDto? PersonaResponsable { get; set; }
        public PersonaSocioDto? PersonaSocio { get; set; }

        public List<GrupoDto> Grupos { get; set; } = new();
    }
}
