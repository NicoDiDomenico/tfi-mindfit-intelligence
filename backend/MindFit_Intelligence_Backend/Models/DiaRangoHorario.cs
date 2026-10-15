using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Globalization;
using System.Text;

namespace MindFit_Intelligence_Backend.Models
{
    [Index(nameof(IdDia), nameof(IdRangoHorario), IsUnique = true)]
    public class DiaRangoHorario
    {
        private static readonly Dictionary<DayOfWeek, string> _diasEspanol = new()
        {
            { DayOfWeek.Monday,    "Lunes"      },
            { DayOfWeek.Tuesday,   "Martes"     },
            { DayOfWeek.Wednesday, "Miércoles"  },
            { DayOfWeek.Thursday,  "Jueves"     },
            { DayOfWeek.Friday,    "Viernes"    },
            { DayOfWeek.Saturday,  "Sábado"     },
            { DayOfWeek.Sunday,    "Domingo"    }
        };

        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int IdDiaRangoHorario { get; set; }

        public int CupoMaximo { get; set; }

        public bool Activo { get; private set; }

        [ForeignKey(nameof(RangoHorario))]
        public int IdRangoHorario { get; set; }

        public RangoHorario RangoHorario { get; set; } = null!;

        [ForeignKey(nameof(Dia))]
        public int IdDia { get; set; }

        public Dia Dia { get; set; } = null!;

        public ICollection<CupoFecha> CupoFechas { get; set; } = new List<CupoFecha>();

        public ICollection<DiaRangoHorarioResponsable> DiaRangoHorarioResponsables { get; set; } = new List<DiaRangoHorarioResponsable>();

        // Hay que separarr la logica de negocio de la logica de persistencia, por lo que esta funcion no deberia estar aca, pero se deja para no complicar mas el proyecto
        public bool CorrespondeADia(DateTime fecha)
        {
            if (!Activo) return false;
            if (Dia is null) return false;

            _diasEspanol.TryGetValue(fecha.DayOfWeek, out var nombreEsperado);
            return string.Equals(NormalizarNombreDia(Dia.NombreDia), NormalizarNombreDia(nombreEsperado), StringComparison.OrdinalIgnoreCase);
        }

        private static string NormalizarNombreDia(string? nombreDia)
        {
            if (string.IsNullOrWhiteSpace(nombreDia))
                return string.Empty;

            var normalized = nombreDia.Normalize(NormalizationForm.FormD);
            var chars = normalized.Where(c => CharUnicodeInfo.GetUnicodeCategory(c) != UnicodeCategory.NonSpacingMark).ToArray();
            return new string(chars).Normalize(NormalizationForm.FormC);
        }

        public void setActivo(bool activo)
        {
            Activo = activo;
        }
    }
}
