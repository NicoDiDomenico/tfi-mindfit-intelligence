using MindFit_Intelligence_Backend.Models.Enums;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MindFit_Intelligence_Backend.Models
{
    public class Cuota
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int IdCuota { get; set; }

        [ForeignKey(nameof(PersonaSocio))]
        public int IdUsuario { get; set; }

        public PersonaSocio PersonaSocio { get; set; } = null!;

        [Column(TypeName = "varchar(50)")]
        public Plan Plan { get; set; }

        [Column(TypeName = "date")]
        public DateTime FechaInicioPeriodo { get; set; }

        [Column(TypeName = "date")]
        public DateTime FechaFinPeriodo { get; set; }

        [Column(TypeName = "decimal(10,2)")]
        public decimal Monto { get; set; }

        [Column(TypeName = "varchar(50)")]
        public EstadoCuota EstadoCuota { get; private set; }

        [Column(TypeName = "date")]
        public DateTime? FechaPago { get; set; }

        private bool PuedeMarcarseComoVencida()
        {
            return FechaFinPeriodo < DateTime.Now
                   && EstadoCuota != EstadoCuota.Vencida;
        }

        public bool SuperaMargenDeGracia() => FechaFinPeriodo.AddDays(30) <= DateTime.Now;

        public void MarcarComoVencida()
        {
            if (!PuedeMarcarseComoVencida()) return;

            EstadoCuota = EstadoCuota.Vencida;
        }

        public void MarcarComoVigente()
        {
            EstadoCuota = EstadoCuota.Vigente;
        }

        // RN: Una cuota bloquea la eliminaci�n si todav�a est� vigente.
        public bool ImpideEliminacionSocio()
        {
            return EstadoCuota == EstadoCuota.Vigente;
        }

        public bool EstaVigenteParaFecha(DateTime fecha) => fecha <= FechaFinPeriodo;
    }
}
