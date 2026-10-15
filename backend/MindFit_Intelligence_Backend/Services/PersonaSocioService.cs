using MindFit_Intelligence_Backend.DTOs.Cuota;
using MindFit_Intelligence_Backend.DTOs.Personas;
using MindFit_Intelligence_Backend.Models;
using MindFit_Intelligence_Backend.Models.Enums;
using MindFit_Intelligence_Backend.Repository.Interfaces;
using MindFit_Intelligence_Backend.Services.Interfaces;

namespace MindFit_Intelligence_Backend.Services
{
    public class PersonaSocioService : IPersonaSocioService
    {
        private readonly IEmailService _emailService;
        private readonly IDiaRepository _diaRepository;
        private readonly ITurnoRepository _turnoRepository;

        public PersonaSocioService(
            IEmailService emailService,
            IDiaRepository diaRepository,
            ITurnoRepository turnoRepository)
        {
            _emailService = emailService;
            _diaRepository = diaRepository;
            _turnoRepository = turnoRepository;
        }

        public async Task<IEnumerable<SocioTurnoDto>> GetSociosConTurnoHoyPorEntrenadorYHorario(int idUsuarioResponsable, int idRangoHorario)
        {
            DateTime fechaActual = DateTime.Today;

            IEnumerable<Turno> turnos = await _turnoRepository
                .GetSociosConTurnoHoyPorEntrenadorYHorario(idUsuarioResponsable, idRangoHorario, fechaActual);

            return turnos
                .Select(t => t.PersonaSocio)
                .Distinct()
                .Select(s => new SocioTurnoDto
                {
                    IdUsuario = s.IdUsuario,
                    Nombre = s.Nombre,
                    Apellido = s.Apellido
                });
        }

        public async Task SetSocioNuevoAsync(PersonaSocio socio, List<int> diasActivosIds)
        {
            var dias = await _diaRepository.GetAll();

            socio.InicializarSocioNuevo(dias, diasActivosIds);
        }

        public Cuota CrearCuotaInicial(PersonaSocio socio, Plan plan, decimal monto)
        {
            var now = DateTime.Now;

            var cuota = new Cuota
            {
                Plan = plan,
                Monto = monto,
                FechaInicioPeriodo = now,
                FechaFinPeriodo = plan switch
                {
                    Plan.Mensual => now.AddMonths(1),
                    Plan.Anual => now.AddYears(1),
                    _ => throw new ArgumentOutOfRangeException(nameof(plan))
                },
                FechaPago = now
            };

            cuota.MarcarComoVigente();

            // IMPORTANTE: PersonaSocio debe tener socio.Cuotas
            socio.Cuotas.Add(cuota);

            return cuota;
        }

        public void SetSocioActualizado(PersonaSocio socio, List<int> diasActivosIds)
        {
            socio.ActualizarRutinas(diasActivosIds);
        }

        public Cuota ActualizarCuota(PersonaSocio socio, Plan plan, decimal monto)
        {
            // Usamos MaxBy para obtener la cuota con la fecha de fin más lejana (MaxBy() = OrderByDescending().FirstOrDefault())
            Cuota? ultimaCuota = socio.Cuotas.MaxBy(c => c.FechaFinPeriodo);

            // Si hay cobertura activa: encadenar al final; si ya venció: arrancar desde hoy
            DateTime inicio = ultimaCuota?.FechaFinPeriodo > DateTime.Now
                ? ultimaCuota.FechaFinPeriodo
                : DateTime.Now;

            var cuota = new Cuota
            {
                Plan = plan,
                Monto = monto,
                FechaInicioPeriodo = inicio,
                FechaFinPeriodo = plan switch
                {
                    Plan.Mensual => inicio.AddMonths(1),
                    Plan.Anual   => inicio.AddYears(1),
                    _ => throw new ArgumentOutOfRangeException(nameof(plan))
                },
                FechaPago = DateTime.Now
            };

            cuota.MarcarComoVigente();

            socio.Cuotas.Add(cuota);

            socio.MarcarComoActualizado();

            return cuota;
        }

        public async Task EnviarEmailBienvenidaAsync(Usuario usuario, Cuota? cuota)
        {
            var socio = usuario.PersonaSocio!;
            string htmlBody = $"""
                <h2>¡Bienvenido/a a MindFit Intelligence, {socio.Nombre} {socio.Apellido}!</h2>
                <p>Tu registro fue completado exitosamente.</p>
                <ul>
                    <li><strong>Cuenta de Usuario:</strong> {usuario.Username}</li>
                    <li><strong>Plan:</strong> {cuota?.Plan}</li>
                    <li><strong>Inicio de actividades:</strong> {socio.FechaInicioActividades:dd/MM/yyyy}</li>
                    <li><strong>Vencimiento:</strong> {cuota?.FechaFinPeriodo:dd/MM/yyyy}</li>
                </ul>
                <p>¡Te esperamos!</p>
                """;

            await _emailService.SendAsync(socio.Email, "Confirmación de registro - MindFit Intelligence", htmlBody);
        }

        public async Task EnviarEmailActualizacionCuotaAsync(Usuario usuario, Cuota? cuota)
        {
            var socio = usuario.PersonaSocio!;
            string htmlBody = $"""
                <h2>Renovación de cuota - MindFit Intelligence</h2>
                <p>Hola {socio.Nombre} {socio.Apellido}, tu cuota fue renovada exitosamente.</p>
                <ul>
                    <li><strong>Plan:</strong> {cuota?.Plan}</li>
                    <li><strong>Período:</strong> {cuota?.FechaInicioPeriodo:dd/MM/yyyy} - {cuota?.FechaFinPeriodo:dd/MM/yyyy}</li>
                    <li><strong>Monto abonado:</strong> ${cuota?.Monto:F2}</li>
                </ul>
                <p>¡Gracias por seguir eligiendo MindFit Intelligence!</p>
                """;

            await _emailService.SendAsync(socio.Email, "Renovación de cuota - MindFit Intelligence", htmlBody);
        }
    }
}
