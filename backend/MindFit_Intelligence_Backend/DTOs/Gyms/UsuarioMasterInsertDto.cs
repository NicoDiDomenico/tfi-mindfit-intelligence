namespace MindFit_Intelligence_Backend.DTOs.Gyms
{
    public class UsuarioMasterInsertDto
    {
        // Datos para el Login
        public string Username { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;

        // Datos personales del dueño
        public PersonaResponsableMasterInsertDto PersonaResponsable { get; set; } = null!;
    }
}
