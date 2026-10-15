using MindFit_Intelligence_Backend.Models.Enums;

namespace MindFit_Intelligence_Backend.DTOs.Personas
{
    public class PersonaResponsableInsertDto
    {
        public string Nombre { get; set; } = string.Empty;

        public string Apellido { get; set; } = string.Empty;

        public string Email { get; set; } = string.Empty;

        public string? Telefono { get; set; }

        public string? Direccion { get; set; }

        public string? Ciudad { get; set; }

        public string TipoDocumento { get; set; } = string.Empty;

        public string NroDocumento { get; set; } = string.Empty;

        public Genero? Genero { get; set; }

        public DateTime? FechaNacimiento { get; set; }
    }
}
