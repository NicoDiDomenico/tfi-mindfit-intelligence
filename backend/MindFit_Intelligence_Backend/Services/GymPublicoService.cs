using Microsoft.AspNetCore.Identity;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using MindFit_Intelligence_Backend.DTOs.Gyms;
using MindFit_Intelligence_Backend.DTOs.PayPal;
using MindFit_Intelligence_Backend.Models.Master;
using MindFit_Intelligence_Backend.Repository.Interfaces;
using MindFit_Intelligence_Backend.Services.Interfaces;
using System.Globalization;
using System.Text;

namespace MindFit_Intelligence_Backend.Services
{
    public class GymPublicoService : IGymPublicoService
    {
        private const decimal MonthlySubscriptionAmount = 160m;
        private const string SubscriptionCurrency = "USD";
        private const string StatusActive = "ACTIVE";
        private const string StatusSuspended = "SUSPENDED";
        private const string StatusCancelled = "CANCELLED";
        private const string StatusExpired = "EXPIRED";

        private readonly IGymRepository _gymRepository;
        private readonly IUsuarioMasterRepository _usuarioMasterRepo;
        private readonly IPayPalService _payPalService;
        private readonly IConfiguration _configuration;
        private readonly MindFitMasterContext _masterContext;
        private readonly TenantProvisioningService _tenantProvisioningService;
        private readonly ILogger<GymPublicoService> _logger;

        public GymPublicoService(
            IGymRepository gymRepository,
            IUsuarioMasterRepository usuarioMasterRepo,
            IPayPalService payPalService,
            IConfiguration configuration,
            MindFitMasterContext masterContext,
            TenantProvisioningService tenantProvisioningService,
            ILogger<GymPublicoService> logger)
        {
            _gymRepository = gymRepository;
            _usuarioMasterRepo = usuarioMasterRepo;
            _payPalService = payPalService;
            _configuration = configuration;
            _masterContext = masterContext;
            _tenantProvisioningService = tenantProvisioningService;
            _logger = logger;
        }

        public async Task<IEnumerable<GymPublicoDTO>> GetAllGymsActivosAsync()
        {
            return await _gymRepository.GetAllGymsActivosAsync();
        }

        public async Task<GymSubscriptionDto> GetMiSuscripcionAsync(int idGym)
        {
            var gym = await _gymRepository.GetByIdAsync(idGym)
                ?? throw new InvalidOperationException("No se encontro el gimnasio.");

            return MapSubscription(gym);
        }

        public async Task<GymSubscriptionDto> ActualizarMiSuscripcionAsync(
            int idGym,
            CancellationToken cancellationToken = default)
        {
            var gym = await GetTrackedGymAsync(idGym, cancellationToken);

            if (string.IsNullOrWhiteSpace(gym.PayPalSubscriptionId))
                throw new InvalidOperationException("El gimnasio no tiene una suscripcion PayPal asociada.");

            var subscription = await _payPalService.GetSubscriptionStatusAsync(
                gym.PayPalSubscriptionId,
                cancellationToken);

            AplicarEstadoPayPal(gym, subscription);
            await AsegurarHistorialInicialAsync(gym, cancellationToken);
            AplicarReglaDeBloqueo(gym, DateTime.UtcNow);

            await _masterContext.SaveChangesAsync(cancellationToken);
            return MapSubscription(gym);
        }

        public async Task<int> RegistrarNuevoGymAsync(
            NuevoGymRequestDto dto,
            PayPalSubscriptionStatusDto paypalSubscription)
        {
            string nombreGymNormalizado = NormalizarNombreGym(dto.NombreGym);

            if (await _gymRepository.ExistsByNombreAsync(nombreGymNormalizado))
                throw new GymOnboardingConflictException("Ya existe un gimnasio registrado con ese nombre.");

            if (await _usuarioMasterRepo.ExistsByUsernameAsync(dto.UsuarioMaster.Username))
                throw new GymOnboardingConflictException("El nombre de usuario ya se encuentra registrado.");

            string nombreBaseDatos = CrearNombreBaseDatos(nombreGymNormalizado);
            var template = _configuration.GetConnectionString("TenantTemplate")
                ?? throw new InvalidOperationException("TenantTemplate no configurado.");
            string connectionString = string.Format(template, nombreBaseDatos);

            var nuevoGym = new Gym
            {
                NombreGym = nombreGymNormalizado,
                ConnectionString = connectionString,
                Activo = false,
                FechaCreacion = DateTime.UtcNow,
                PayPalSubscriptionId = paypalSubscription.SubscriptionId,
                EstadoSuscripcionPayPal = paypalSubscription.Status,
                FechaProximoPagoUtc = paypalSubscription.NextBillingTimeUtc,
                FechaEstadoSuscripcionUtc = paypalSubscription.StatusUpdateTimeUtc,
                FechaUltimaVerificacionPayPalUtc = paypalSubscription.LastVerificationPayPalUtc,
                PayPalPlanId = paypalSubscription.PlanId
            };

            var personaDto = dto.UsuarioMaster.PersonaResponsable;
            var persona = new PersonaResponsableMaster
            {
                Nombre = personaDto.Nombre,
                Apellido = personaDto.Apellido,
                Email = personaDto.Email,
                Telefono = personaDto.Telefono,
                Direccion = personaDto.Direccion,
                Ciudad = personaDto.Ciudad,
                TipoDocumento = personaDto.TipoDocumento,
                NroDocumento = personaDto.NroDocumento,
                Genero = personaDto.Genero,
                FechaNacimiento = personaDto.FechaNacimiento
            };

            var usuarioDto = dto.UsuarioMaster;
            var usuario = new UsuarioMaster
            {
                Username = usuarioDto.Username,
                Gym = nuevoGym,
                FechaRegistro = DateTime.UtcNow,
                PersonaResponsableMaster = persona
            };

            usuario.PasswordHash = new PasswordHasher<UsuarioMaster>()
                .HashPassword(usuario, usuarioDto.Password);

            int idGym;
            await using var transaction = await _masterContext.Database.BeginTransactionAsync();

            try
            {
                idGym = await _gymRepository.AddGymAsync(nuevoGym);
                await _usuarioMasterRepo.Add(usuario);
                await _usuarioMasterRepo.Save();

                await transaction.CommitAsync();
            }
            catch (DbUpdateException ex) when (EsViolacionDeUnicidad(ex))
            {
                await transaction.RollbackAsync();
                throw new GymOnboardingConflictException(
                    "Ya existe un gimnasio o nombre de usuario con esos datos.",
                    ex);
            }
            catch (DbUpdateException ex)
            {
                await transaction.RollbackAsync();
                throw new InvalidOperationException(
                    "Error al guardar el gimnasio y su usuario maestro.",
                    ex);
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                throw new InvalidOperationException(
                    "Error al registrar el gimnasio en la base maestra.",
                    ex);
            }

            try
            {
                await _tenantProvisioningService.CrearYAplicarMigracionesAsync(connectionString);
                await _tenantProvisioningService.InicializarDatosYAdministradorAsync(
                    connectionString,
                    dto.UsuarioMaster);
                await _gymRepository.ActualizarActivoAsync(idGym, true);

                _logger.LogInformation(
                    "Onboarding completado y gimnasio {IdGym} activado.",
                    idGym);

                return idGym;
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Fallo el aprovisionamiento del gimnasio {IdGym}. El gimnasio permanece inactivo.",
                    idGym);

                throw new InvalidOperationException(
                    "No se pudo crear y preparar la base del gimnasio. El gimnasio permanece inactivo.",
                    ex);
            }
        }

        private static string NormalizarNombreGym(string nombreGym)
        {
            if (string.IsNullOrWhiteSpace(nombreGym))
                throw new ArgumentException("El nombre del gimnasio es obligatorio.", nameof(nombreGym));

            string nombreNormalizado = string.Join(' ', nombreGym
                .Trim()
                .Split((char[]?)null, StringSplitOptions.RemoveEmptyEntries));

            if (nombreNormalizado.Length > 150)
                throw new ArgumentException(
                    "El nombre del gimnasio no puede superar los 150 caracteres.",
                    nameof(nombreGym));

            return nombreNormalizado;
        }

        private static string CrearNombreBaseDatos(string nombreGym)
        {
            string sinDiacriticos = nombreGym.Normalize(NormalizationForm.FormD);
            string slug = new string(sinDiacriticos
                .Where(c => CharUnicodeInfo.GetUnicodeCategory(c) != UnicodeCategory.NonSpacingMark)
                .Where(char.IsLetterOrDigit)
                .ToArray());

            if (string.IsNullOrEmpty(slug))
                slug = "Gym";

            slug = slug.Length > 80 ? slug[..80] : slug;
            string sufijoUnico = Guid.NewGuid().ToString("N")[..8];

            return $"MindFit_{slug}_{sufijoUnico}";
        }

        private static bool EsViolacionDeUnicidad(DbUpdateException exception)
        {
            return exception.InnerException is SqlException sqlException
                && sqlException.Number is 2601 or 2627;
        }

        private static GymSubscriptionDto MapSubscription(Gym gym)
        {
            var now = DateTime.UtcNow;
            var estado = NormalizarEstado(gym.EstadoSuscripcionPayPal);
            var tieneAccesoFuturo = gym.FechaAccesoHastaUtc.HasValue && gym.FechaAccesoHastaUtc.Value > now;
            var accesoBloqueado = DebeBloquearAcceso(gym, now);
            var puedeCancelar = estado == StatusActive && gym.FechaProximoPagoUtc.HasValue;
            var puedeReactivar = estado == StatusSuspended;
            var puedeVolverASuscribirse =
                (estado == StatusCancelled || estado == StatusExpired)
                && !tieneAccesoFuturo;

            return new GymSubscriptionDto
            {
                IdGym = gym.IdGym,
                PayPalSubscriptionId = gym.PayPalSubscriptionId,
                EstadoSuscripcionPayPal = gym.EstadoSuscripcionPayPal,
                EstadoSuscripcionTexto = TraducirEstado(gym.EstadoSuscripcionPayPal),
                MensajeCliente = CrearMensajeCliente(gym, now),
                ImporteMensual = MonthlySubscriptionAmount,
                Moneda = SubscriptionCurrency,
                FechaProximoPagoUtc = gym.FechaProximoPagoUtc,
                FechaAccesoHastaUtc = gym.FechaAccesoHastaUtc,
                FechaEstadoSuscripcionUtc = gym.FechaEstadoSuscripcionUtc,
                FechaUltimaVerificacionPayPalUtc = gym.FechaUltimaVerificacionPayPalUtc,
                AccesoBloqueadoPorSuscripcion = accesoBloqueado,
                PuedeCancelar = puedeCancelar,
                PuedeReactivar = puedeReactivar,
                PuedeVolverASuscribirse = puedeVolverASuscribirse,
                MotivoAccionDeshabilitada = CrearMotivoAccionDeshabilitada(gym, now)
            };
        }

        public async Task<GymSubscriptionDto> CancelarMiSuscripcionAsync(
            int idGym,
            CancellationToken cancellationToken = default)
        {
            var gym = await GetTrackedGymAsync(idGym, cancellationToken);
            var estado = NormalizarEstado(gym.EstadoSuscripcionPayPal);

            if (string.IsNullOrWhiteSpace(gym.PayPalSubscriptionId))
                throw new InvalidOperationException("El gimnasio no tiene una suscripcion PayPal asociada.");

            if (estado != StatusActive)
                throw new InvalidOperationException("Solo se puede cancelar una suscripcion activa.");

            if (!gym.FechaProximoPagoUtc.HasValue)
                throw new InvalidOperationException("No se puede cancelar porque falta la fecha del proximo pago. Actualiza el estado de PayPal primero.");

            var fechaAccesoHastaUtc = gym.FechaProximoPagoUtc.Value;

            RegistrarHistorial(gym, "Cancelacion", fechaAccesoHastaUtc, null);

            var subscription = await _payPalService.CancelSubscriptionAsync(
                gym.PayPalSubscriptionId,
                "Cancelacion solicitada desde MindFit",
                cancellationToken);

            AplicarEstadoPayPal(gym, subscription);
            await AsegurarHistorialInicialAsync(gym, cancellationToken);
            gym.FechaAccesoHastaUtc = fechaAccesoHastaUtc;
            AplicarReglaDeBloqueo(gym, DateTime.UtcNow);

            await _masterContext.SaveChangesAsync(cancellationToken);
            return MapSubscription(gym);
        }

        public async Task<GymSubscriptionDto> ReactivarMiSuscripcionAsync(
            int idGym,
            CancellationToken cancellationToken = default)
        {
            var gym = await GetTrackedGymAsync(idGym, cancellationToken);

            if (string.IsNullOrWhiteSpace(gym.PayPalSubscriptionId))
                throw new InvalidOperationException("El gimnasio no tiene una suscripcion PayPal asociada.");

            if (NormalizarEstado(gym.EstadoSuscripcionPayPal) != StatusSuspended)
                throw new InvalidOperationException("Solo se puede reactivar una suscripcion suspendida.");

            var subscription = await _payPalService.ActivateSubscriptionAsync(
                gym.PayPalSubscriptionId,
                "Reactivacion solicitada desde MindFit",
                cancellationToken);

            RegistrarHistorial(gym, "Reactivacion", gym.FechaAccesoHastaUtc, null);
            AplicarEstadoPayPal(gym, subscription);
            await AsegurarHistorialInicialAsync(gym, cancellationToken);
            AplicarReglaDeBloqueo(gym, DateTime.UtcNow);

            await _masterContext.SaveChangesAsync(cancellationToken);
            return MapSubscription(gym);
        }

        public async Task<GymSubscriptionDto> ConfirmarResuscripcionAsync(
            int idGym,
            string payPalSubscriptionId,
            CancellationToken cancellationToken = default)
        {
            if (string.IsNullOrWhiteSpace(payPalSubscriptionId))
                throw new ArgumentException("El id de suscripcion PayPal es obligatorio.", nameof(payPalSubscriptionId));

            var gym = await GetTrackedGymAsync(idGym, cancellationToken);
            var now = DateTime.UtcNow;

            if (gym.FechaAccesoHastaUtc.HasValue && gym.FechaAccesoHastaUtc.Value > now)
                throw new InvalidOperationException("Todavia tenes un periodo pago vigente. Vas a poder volver a suscribirte cuando finalice.");

            var subscription = await _payPalService.WaitForActiveSubscriptionAsync(
                payPalSubscriptionId,
                cancellationToken);

            if (!subscription.IsActive)
                throw new InvalidOperationException($"La nueva suscripcion PayPal debe estar ACTIVE. Estado actual: {subscription.Status}.");

            if (!string.IsNullOrWhiteSpace(gym.PayPalSubscriptionId))
            {
                RegistrarHistorial(
                    gym,
                    "ReemplazoPorNuevaSuscripcion",
                    gym.FechaAccesoHastaUtc,
                    now);
            }

            AplicarEstadoPayPal(gym, subscription);
            gym.FechaAccesoHastaUtc = null;
            gym.AccesoBloqueadoPorSuscripcion = false;
            gym.FechaBloqueoSuscripcionUtc = null;
            gym.PayPalPlanId = subscription.PlanId;

            await _masterContext.SaveChangesAsync(cancellationToken);
            return MapSubscription(gym);
        }

        private async Task<Gym> GetTrackedGymAsync(int idGym, CancellationToken cancellationToken)
        {
            return await _masterContext.Gyms
                .FirstOrDefaultAsync(g => g.IdGym == idGym, cancellationToken)
                ?? throw new InvalidOperationException("No se encontro el gimnasio.");
        }

        private void RegistrarHistorial(
            Gym gym,
            string motivo,
            DateTime? fechaFinAccesoUtc,
            DateTime? fechaReemplazoUtc)
        {
            if (string.IsNullOrWhiteSpace(gym.PayPalSubscriptionId))
                return;

            _masterContext.GymPayPalSubscriptionHistorial.Add(new GymPayPalSubscriptionHistorial
            {
                IdGym = gym.IdGym,
                PayPalSubscriptionId = gym.PayPalSubscriptionId,
                PayPalPlanId = gym.PayPalPlanId,
                EstadoPayPal = gym.EstadoSuscripcionPayPal,
                FechaInicioUtc = gym.FechaCreacion,
                FechaFinAccesoUtc = fechaFinAccesoUtc,
                FechaReemplazoUtc = fechaReemplazoUtc,
                Motivo = motivo,
                FechaRegistroUtc = DateTime.UtcNow
            });
        }

        private async Task AsegurarHistorialInicialAsync(
            Gym gym,
            CancellationToken cancellationToken = default)
        {
            if (string.IsNullOrWhiteSpace(gym.PayPalSubscriptionId))
                return;

            var hasHistory = await _masterContext.GymPayPalSubscriptionHistorial
                .AnyAsync(h => h.IdGym == gym.IdGym, cancellationToken);

            if (hasHistory)
                return;

            _masterContext.GymPayPalSubscriptionHistorial.Add(new GymPayPalSubscriptionHistorial
            {
                IdGym = gym.IdGym,
                PayPalSubscriptionId = gym.PayPalSubscriptionId,
                PayPalPlanId = gym.PayPalPlanId,
                EstadoPayPal = gym.EstadoSuscripcionPayPal,
                FechaInicioUtc = gym.FechaCreacion,
                FechaFinAccesoUtc = gym.FechaAccesoHastaUtc,
                Motivo = "AltaInicialDetectada",
                FechaRegistroUtc = DateTime.UtcNow
            });
        }

        private static void AplicarEstadoPayPal(Gym gym, PayPalSubscriptionStatusDto subscription)
        {
            if (NormalizarEstado(subscription.Status) == StatusCancelled
                && !gym.FechaAccesoHastaUtc.HasValue
                && gym.FechaProximoPagoUtc.HasValue)
            {
                gym.FechaAccesoHastaUtc = gym.FechaProximoPagoUtc;
            }

            gym.PayPalSubscriptionId = subscription.SubscriptionId;
            gym.PayPalPlanId = subscription.PlanId ?? gym.PayPalPlanId;
            gym.EstadoSuscripcionPayPal = subscription.Status;
            gym.FechaProximoPagoUtc = subscription.NextBillingTimeUtc;
            gym.FechaEstadoSuscripcionUtc = subscription.StatusUpdateTimeUtc;
            gym.FechaUltimaVerificacionPayPalUtc = subscription.LastVerificationPayPalUtc;
        }

        private static void AplicarReglaDeBloqueo(Gym gym, DateTime now)
        {
            var debeBloquear = DebeBloquearAcceso(gym, now);
            gym.AccesoBloqueadoPorSuscripcion = debeBloquear;
            gym.FechaBloqueoSuscripcionUtc = debeBloquear
                ? gym.FechaBloqueoSuscripcionUtc ?? now
                : null;
        }

        public static bool DebeBloquearAcceso(Gym gym, DateTime now)
        {
            var estado = NormalizarEstado(gym.EstadoSuscripcionPayPal);

            if (estado == StatusSuspended || estado == StatusExpired)
                return true;

            if (estado == StatusCancelled)
                return !gym.FechaAccesoHastaUtc.HasValue || gym.FechaAccesoHastaUtc.Value <= now;

            return gym.AccesoBloqueadoPorSuscripcion && estado != StatusActive;
        }

        private static string NormalizarEstado(string? estado)
        {
            return string.IsNullOrWhiteSpace(estado)
                ? string.Empty
                : estado.Trim().ToUpperInvariant();
        }

        private static string TraducirEstado(string? estado)
        {
            return NormalizarEstado(estado) switch
            {
                "APPROVAL_PENDING" => "Pendiente de aprobacion",
                "APPROVED" => "Aprobada, activacion pendiente",
                StatusActive => "Activa",
                StatusSuspended => "Suspendida",
                StatusCancelled => "Cancelada",
                StatusExpired => "Vencida",
                _ => "No disponible"
            };
        }

        private static string CrearMensajeCliente(Gym gym, DateTime now)
        {
            var estado = NormalizarEstado(gym.EstadoSuscripcionPayPal);

            return estado switch
            {
                StatusActive => gym.FechaProximoPagoUtc.HasValue
                    ? $"Tu suscripcion esta activa. El proximo cobro sera el {gym.FechaProximoPagoUtc.Value:dd/MM/yyyy}."
                    : "Tu suscripcion esta activa.",
                StatusSuspended => "La suscripcion esta suspendida. El acceso operativo esta pausado hasta reactivarla.",
                StatusCancelled when gym.FechaAccesoHastaUtc.HasValue && gym.FechaAccesoHastaUtc.Value > now =>
                    $"La suscripcion esta cancelada. Conservas acceso hasta el {gym.FechaAccesoHastaUtc.Value:dd/MM/yyyy}.",
                StatusCancelled => "La suscripcion esta cancelada y el periodo pago ya finalizo. Volve a suscribirte para recuperar el acceso operativo.",
                StatusExpired => "La suscripcion vencio. Volve a suscribirte para recuperar el acceso operativo.",
                "APPROVED" => "La suscripcion fue aprobada y esta pendiente de activacion.",
                "APPROVAL_PENDING" => "La suscripcion esta pendiente de aprobacion en PayPal.",
                _ => "No hay informacion disponible de la suscripcion."
            };
        }

        private static string? CrearMotivoAccionDeshabilitada(Gym gym, DateTime now)
        {
            var estado = NormalizarEstado(gym.EstadoSuscripcionPayPal);

            if (estado == StatusActive && !gym.FechaProximoPagoUtc.HasValue)
                return "Actualiza el estado de PayPal para obtener la fecha del proximo pago antes de cancelar.";

            if (estado == StatusCancelled && gym.FechaAccesoHastaUtc.HasValue && gym.FechaAccesoHastaUtc.Value > now)
                return "Todavia tenes un periodo pago vigente. La resuscripcion se habilita al finalizar ese periodo.";

            return null;
        }
    }
}
