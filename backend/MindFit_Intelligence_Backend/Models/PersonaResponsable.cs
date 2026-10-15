using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;
using MindFit_Intelligence_Backend.Models.Enums;

namespace MindFit_Intelligence_Backend.Models
{
    public class PersonaResponsable
    {
        [Key]
        public int IdUsuario { get; set; } // PK y FK a Usuario

        public Usuario Usuario { get; set; } = null!; // Navegación a Usuario

        [Column(TypeName = "varchar(50)")]
        public string Nombre { get; set; } = string.Empty;

        [Column(TypeName = "varchar(50)")]
        public string Apellido { get; set; } = string.Empty;

        [Column(TypeName = "varchar(50)")]
        public string Email { get; set; } = string.Empty;

        [Column(TypeName = "varchar(20)")]
        public string? Telefono { get; set; }

        [Column(TypeName = "varchar(50)")]
        public string? Direccion { get; set; }

        [Column(TypeName = "varchar(50)")]
        public string? Ciudad { get; set; }

        [Column(TypeName = "varchar(50)")]
        public string TipoDocumento { get; set; } = string.Empty;

        [Column(TypeName = "varchar(20)")]
        public string NroDocumento { get; set; } = string.Empty;

        [Column(TypeName = "varchar(20)")]
        public Genero? Genero { get; set; }

        [Column(TypeName = "date")]
        public DateTime? FechaNacimiento { get; set; }

        public ICollection<Turno> Turnos { get; set; } = new List<Turno>();

        public ICollection<DiaRangoHorarioResponsable> DiaRangoHorarioResponsables { get; set; } = new List<DiaRangoHorarioResponsable>();
    }
}
