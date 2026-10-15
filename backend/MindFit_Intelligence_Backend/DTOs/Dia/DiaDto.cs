using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MindFit_Intelligence_Backend.DTOs.Dia
{
    public class DiaDto
    {
        public int IdDia { get; set; }

        public string NombreDia { get; set; } = string.Empty;
    }
}
