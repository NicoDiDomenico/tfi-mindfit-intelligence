using MindFit_Intelligence_Backend.DTOs.Cuota;
using MindFit_Intelligence_Backend.DTOs.PerfilIA;
using MindFit_Intelligence_Backend.DTOs.Rutina;
using MindFit_Intelligence_Backend.DTOs.Usuarios;
using MindFit_Intelligence_Backend.Models.Enums;

namespace MindFit_Intelligence_Backend.DTOs.Personas
{
    public class PersonaSocioUpdateDto
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
        public string? ObraSocial { get; set; }
        public DateTime? FechaNotificacion { get; set; }
        public bool? RespuestaNotificacion { get; set; }
        public string? Pregunta { get; set; }
        public string? Respuesta { get; set; }
        public required List<int> DiasActivosIds { get; set; }
        public PerfilIAUpdateDto? PerfilIA { get; set; }
        public required CuotaUpdateDto Cuota { get; set; }
    }
}
