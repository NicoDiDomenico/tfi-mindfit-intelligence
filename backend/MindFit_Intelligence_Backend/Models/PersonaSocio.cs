using MindFit_Intelligence_Backend.Models.Enums;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MindFit_Intelligence_Backend.Models
{
    public class PersonaSocio
    {
        [Key]
        [ForeignKey(nameof(Usuario))]
        [DatabaseGenerated(DatabaseGeneratedOption.None)]
        public int IdUsuario { get; set; } // PK y FK a Usuario

        public Usuario Usuario { get; set; } = null!; // Navegación a Usuario

        // Datos personales
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

        // Datos del socio
        [Column(TypeName = "varchar(50)")]
        public string? ObraSocial { get; set; }

        [Column(TypeName = "varchar(50)")]
        public EstadoSocio EstadoSocio { get; private set; }

        // Actividades
        [Column(TypeName = "date")]
        public DateTime? FechaInicioActividades { get; set; }

        // Notificaciones
        [Column(TypeName = "date")]
        public DateTime? FechaNotificacion { get; set; }

        public bool? RespuestaNotificacion { get; set; }

        [Column(TypeName = "varchar(100)")]
        public string? Pregunta { get; set; }

        [Column(TypeName = "varchar(100)")]
        public string? Respuesta { get; set; }

        public required ICollection<Rutina> Rutinas { get; set; }

        public ICollection<Cuota> Cuotas { get; set; } = new List<Cuota>();

        public PerfilIA? PerfilIA { get; set; }

        public ICollection<Turno> Turnos { get; set; } = new List<Turno>();

        private bool PuedeMarcarseComoSuspendido() =>
            EstadoSocio != EstadoSocio.Supendido
            && EstadoSocio != EstadoSocio.Eliminado;

        public void MarcarComoSuspendido()
        {
            if (PuedeMarcarseComoSuspendido())
                EstadoSocio = EstadoSocio.Supendido;
        }

        // RN: Si pasaron más de 30 días desde que venció su última cuota el etsado del socio pasa a eliminado
        public void MarcarComoEliminado()
        {
            EstadoSocio = EstadoSocio.Eliminado;
        }

        public bool PuedePasarAActualizado() =>
            EstadoSocio != EstadoSocio.Supendido
            && EstadoSocio != EstadoSocio.Eliminado;

        public void MarcarComoActualizado()
        {
            EstadoSocio = EstadoSocio.Actualizado;
        }

        public void MarcarComoNuevo()
        {
            EstadoSocio = EstadoSocio.Nuevo;
        }

        // RN: Solo se puede recuperar a alguien que actualmente tiene estado Eliminado
        public bool PuedeSerRecuperado()
        {
            return EstadoSocio == EstadoSocio.Eliminado;
        }

        public bool PuedeReservarTurno() =>
            EstadoSocio == EstadoSocio.Nuevo || EstadoSocio == EstadoSocio.Actualizado;

        private void SetRutinas(IEnumerable<Dia> dias, DateTime inicio, List<int> diasActivosIds)
        {
            Rutinas = new List<Rutina>();
            foreach (var dia in dias)
            {
                Rutinas.Add(new Rutina
                {
                    IdDia = dia.IdDia,
                    FechaModificacion = inicio,
                    Activo = diasActivosIds.Contains(dia.IdDia)
                });
            }
        }

        public void InicializarSocioNuevo(IEnumerable<Dia> dias, List<int> diasActivosIds)
        {
            var inicio = DateTime.Now;
            this.FechaInicioActividades = inicio;

            this.SetRutinas(dias, inicio, diasActivosIds);

            this.MarcarComoNuevo();
        }

        public void ActualizarRutinas(List<int> diasActivosIds)
        {
            var ahora = DateTime.Now;

            foreach (var rutina in Rutinas)
            {
                rutina.Activo = diasActivosIds.Contains(rutina.IdDia);
                rutina.FechaModificacion = ahora;
            }

            // Aplicamos la lógica de estado si corresponde
            if (PuedePasarAActualizado())
            {
                MarcarComoActualizado();
            }
        }
    }
}
