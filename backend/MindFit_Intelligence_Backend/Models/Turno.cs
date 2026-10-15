using MindFit_Intelligence_Backend.Models.Enums;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using static System.Runtime.InteropServices.JavaScript.JSType;

namespace MindFit_Intelligence_Backend.Models
{
    public class Turno
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int IdTurno { get; set; }

        [ForeignKey(nameof(PersonaResponsable))]
        public int IdUsuarioResponsable { get; set; }

        public PersonaResponsable PersonaResponsable { get; set; } = null!;

        [ForeignKey(nameof(PersonaSocio))]
        public int IdUsuarioSocio { get; set; }

        public PersonaSocio PersonaSocio { get; set; } = null!;

        [ForeignKey(nameof(CupoFecha))]
        public int IdCupoFecha { get; set; }

        public CupoFecha CupoFecha { get; set; } = null!;

        [Column(TypeName = "date")]
        public DateTime FechaAlta { get; set; }

        public EstadoTurno EstadoTurno { get; private set; }

        public void Iniciar() => EstadoTurno = EstadoTurno.EnCurso;
        public void Cancelar() => EstadoTurno = EstadoTurno.Cancelado;
        public void Finalizar() => EstadoTurno = EstadoTurno.Finalizado;

        public void Vencido() => EstadoTurno = EstadoTurno.Vencido;

        // Lógica de validación dentro de la entidad (DDD)
        public bool ValidarAntelacion(List<string> Errors)
        {
            if (CupoFecha?.DiaRangoHorario?.RangoHorario == null)
            {
                Errors.Add("Error interno: Faltan datos del horario para validar la antelación.");
                return false;
            }

            // Unimos la fecha (00:00:00) con la HoraDesde del rango para tener el momento exacto
            DateTime fechaYHoraExactaDelTurno = CupoFecha.Fecha.Add(CupoFecha.DiaRangoHorario.RangoHorario.HoraDesde);

            var horasAntelacion = (fechaYHoraExactaDelTurno - DateTime.Now).TotalHours;

            if (horasAntelacion < 3)
            {
                Errors.Add("El turno ya no puede cancelarse por superar el límite de tiempo mínimo permitido (3 horas antes del turno).");
                return false;
            }
            return true;
        }

        public bool ValidarVencimiento()
        {
            // Un turno se considera vencido si la fecha del turno es anterior a la fecha actual
            if (CupoFecha.Fecha < DateTime.Today)
                return true;
            return false;
        }
    }
}
