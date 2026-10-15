using MindFit_Intelligence_Backend.Models.Enums;

namespace MindFit_Intelligence_Backend.DTOs.Usuarios
{
    public class SocioGridDto
    {
        public int IdUsuario { get; set; }
        public string Username { get; set; } = string.Empty;
        public DateTime FechaRegistro { get; set; }
        public string? NombreCompleto { get; set; }
        public string? Email { get; set; }
        public EstadoSocio EstadoSocio { get; set; }
        public Plan? Plan { get; set; }
        public DateTime? FechaFinPeriodo { get; set; }
        public string? NroDocumento { get; set; } // --> Lo agregue nuevo asi lo mostraba en el grid de turnos del Socio selecionado
    }
}
