using MindFit_Intelligence_Backend.DTOs.Grupos;
using MindFit_Intelligence_Backend.DTOs.Personas;

namespace MindFit_Intelligence_Backend.DTOs.Usuarios
{
    public class UsuarioInsertDto
    {
        #region JWT
        public string Username { get; set; } = string.Empty;
        public string Password { get; set; } = null!;
        #endregion
        public string TipoPersona { get; set; } = ""; // "Responsable" | "Socio"
        public PersonaResponsableInsertDto? PersonaResponsable { get; set; }
        public PersonaSocioInsertDto? PersonaSocio { get; set; }
        public List<int> IdGrupos { get; set; } = new();
    }
}
