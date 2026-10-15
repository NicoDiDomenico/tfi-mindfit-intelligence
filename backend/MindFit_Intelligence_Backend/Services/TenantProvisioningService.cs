using Microsoft.AspNetCore.Identity;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using MindFit_Intelligence_Backend.DTOs.Gyms;
using MindFit_Intelligence_Backend.Models;
using System.Data;
using System.Globalization;

namespace MindFit_Intelligence_Backend.Services
{
    public class TenantProvisioningService
    {
        private const int MigrationCommandTimeoutSeconds = 120;
        private readonly IConfiguration _configuration;
        private readonly ILogger<TenantProvisioningService> _logger;
        private readonly TenantInitialDataSeeder _initialDataSeeder;

        public TenantProvisioningService(
            IConfiguration configuration,
            ILogger<TenantProvisioningService> logger,
            TenantInitialDataSeeder initialDataSeeder)
        {
            _configuration = configuration;
            _logger = logger;
            _initialDataSeeder = initialDataSeeder;
        }

        public async Task CrearYAplicarMigracionesAsync(
            string connectionString,
            CancellationToken cancellationToken = default)
        {
            var tenantConnection = ValidarConnectionString(connectionString);
            string databaseName = tenantConnection.InitialCatalog;

            await ValidarQueLaBaseNoExistaAsync(tenantConnection, cancellationToken);

            var options = CrearOpcionesTenant(tenantConnection.ConnectionString);

            await using var tenantContext = new MindFitIntelligenceContext(options);

            try
            {
                _logger.LogInformation(
                    "Iniciando migraciones para la nueva base tenant {DatabaseName}.",
                    databaseName);

                await tenantContext.Database.MigrateAsync(cancellationToken);
                await VerificarMigracionesAsync(tenantContext, cancellationToken);

                _logger.LogInformation(
                    "Migraciones completadas para la base tenant {DatabaseName}.",
                    databaseName);
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "No se pudieron aplicar las migraciones a la base tenant {DatabaseName}.",
                    databaseName);
                throw;
            }
        }

        public async Task InicializarDatosYAdministradorAsync(
            string connectionString,
            UsuarioMasterInsertDto administratorDto,
            CancellationToken cancellationToken = default)
        {
            ArgumentNullException.ThrowIfNull(administratorDto);
            ValidarAdministrador(administratorDto);

            var tenantConnection = ValidarConnectionString(connectionString);
            string databaseName = tenantConnection.InitialCatalog;
            var options = CrearOpcionesTenant(tenantConnection.ConnectionString);

            await using var tenantContext = new MindFitIntelligenceContext(options);
            await VerificarMigracionesAsync(tenantContext, cancellationToken);
            await using var transaction = await tenantContext.Database
                .BeginTransactionAsync(cancellationToken);

            try
            {
                await _initialDataSeeder.SeedAsync(tenantContext, cancellationToken);
                await CrearAdministradorAsync(tenantContext, administratorDto, cancellationToken);
                await transaction.CommitAsync(cancellationToken);

                _logger.LogInformation(
                    "Seed y administrador creados para la base tenant {DatabaseName}.",
                    databaseName);
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync(cancellationToken);
                _logger.LogError(
                    ex,
                    "No se pudieron inicializar los datos y el administrador de la base tenant {DatabaseName}.",
                    databaseName);
                throw;
            }
        }

        private static DbContextOptions<MindFitIntelligenceContext> CrearOpcionesTenant(
            string connectionString)
        {
            return new DbContextOptionsBuilder<MindFitIntelligenceContext>()
                .UseSqlServer(
                    connectionString,
                    sqlOptions => sqlOptions.CommandTimeout(MigrationCommandTimeoutSeconds))
                .Options;
        }

        private static async Task CrearAdministradorAsync(
            MindFitIntelligenceContext tenantContext,
            UsuarioMasterInsertDto administratorDto,
            CancellationToken cancellationToken)
        {
            bool usernameExists = await tenantContext.Usuarios
                .AnyAsync(u => u.Username == administratorDto.Username, cancellationToken);

            if (usernameExists)
                throw new InvalidOperationException("El username del administrador ya existe en la base tenant.");

            Grupo? adminGroup = await tenantContext.Grupos
                .SingleOrDefaultAsync(g => g.Nombre == "Admin", cancellationToken);

            if (adminGroup is null)
                throw new InvalidOperationException("No se encontró el grupo estructural Admin.");

            var personDto = administratorDto.PersonaResponsable;
            var administrator = new Usuario
            {
                Username = administratorDto.Username,
                FechaRegistro = DateTime.UtcNow,
                PersonaResponsable = new PersonaResponsable
                {
                    Nombre = personDto.Nombre,
                    Apellido = personDto.Apellido,
                    Email = personDto.Email,
                    Telefono = personDto.Telefono,
                    Direccion = personDto.Direccion,
                    Ciudad = personDto.Ciudad,
                    TipoDocumento = personDto.TipoDocumento,
                    NroDocumento = personDto.NroDocumento,
                    Genero = personDto.Genero,
                    FechaNacimiento = personDto.FechaNacimiento
                },
                UsuarioGrupos = new List<UsuarioGrupo>
                {
                    new() { IdGrupo = adminGroup.IdGrupo }
                }
            };

            administrator.PasswordHash = new PasswordHasher<Usuario>()
                .HashPassword(administrator, administratorDto.Password);

            tenantContext.Usuarios.Add(administrator);
            await tenantContext.SaveChangesAsync(cancellationToken);
        }

        private static void ValidarAdministrador(UsuarioMasterInsertDto administratorDto)
        {
            if (string.IsNullOrWhiteSpace(administratorDto.Username))
                throw new ArgumentException("El username del administrador es obligatorio.");

            if (administratorDto.Username.Length > 50)
                throw new ArgumentException("El username del administrador no puede superar los 50 caracteres.");

            if (string.IsNullOrWhiteSpace(administratorDto.Password))
                throw new ArgumentException("La contraseña del administrador es obligatoria.");

            if (administratorDto.PersonaResponsable is null)
                throw new ArgumentException("Los datos personales del administrador son obligatorios.");

            var person = administratorDto.PersonaResponsable;
            ValidarTextoRequerido(person.Nombre, 50, "nombre");
            ValidarTextoRequerido(person.Apellido, 50, "apellido");
            ValidarTextoRequerido(person.Email, 50, "email");
            ValidarTextoRequerido(person.TipoDocumento, 50, "tipo de documento");
            ValidarTextoRequerido(person.NroDocumento, 20, "número de documento");
            ValidarTextoOpcional(person.Telefono, 20, "teléfono");
            ValidarTextoOpcional(person.Direccion, 50, "dirección");
            ValidarTextoOpcional(person.Ciudad, 50, "ciudad");
        }

        private static void ValidarTextoRequerido(string value, int maxLength, string fieldName)
        {
            if (string.IsNullOrWhiteSpace(value))
                throw new ArgumentException($"El campo {fieldName} es obligatorio para el administrador.");

            ValidarTextoOpcional(value, maxLength, fieldName);
        }

        private static void ValidarTextoOpcional(string? value, int maxLength, string fieldName)
        {
            if (value?.Length > maxLength)
            {
                throw new ArgumentException(
                    $"El campo {fieldName} no puede superar los {maxLength} caracteres.");
            }
        }

        private SqlConnectionStringBuilder ValidarConnectionString(string connectionString)
        {
            if (string.IsNullOrWhiteSpace(connectionString))
                throw new ArgumentException("La connection string tenant es obligatoria.", nameof(connectionString));

            SqlConnectionStringBuilder tenantConnection;

            try
            {
                tenantConnection = new SqlConnectionStringBuilder(connectionString);
            }
            catch (ArgumentException ex)
            {
                throw new InvalidOperationException("La connection string tenant no es válida.", ex);
            }

            if (string.IsNullOrWhiteSpace(tenantConnection.DataSource))
                throw new InvalidOperationException("La connection string tenant no define un servidor.");

            if (string.IsNullOrWhiteSpace(tenantConnection.InitialCatalog))
                throw new InvalidOperationException("La connection string tenant no define una base de datos.");

            ValidarNombreBaseDatos(tenantConnection.InitialCatalog);
            ValidarContraTemplate(tenantConnection);

            return tenantConnection;
        }

        private void ValidarContraTemplate(SqlConnectionStringBuilder tenantConnection)
        {
            string template = _configuration.GetConnectionString("TenantTemplate")
                ?? throw new InvalidOperationException("TenantTemplate no configurado.");

            SqlConnectionStringBuilder expectedConnection;

            try
            {
                string expectedConnectionString = string.Format(
                    CultureInfo.InvariantCulture,
                    template,
                    tenantConnection.InitialCatalog);
                expectedConnection = new SqlConnectionStringBuilder(expectedConnectionString);
            }
            catch (Exception ex) when (ex is ArgumentException or FormatException)
            {
                throw new InvalidOperationException("TenantTemplate no tiene un formato válido.", ex);
            }

            if (!string.Equals(
                    tenantConnection.DataSource,
                    expectedConnection.DataSource,
                    StringComparison.OrdinalIgnoreCase)
                || !string.Equals(
                    tenantConnection.InitialCatalog,
                    expectedConnection.InitialCatalog,
                    StringComparison.Ordinal))
            {
                throw new InvalidOperationException(
                    "La connection string tenant no coincide con el servidor y la base generados por el backend.");
            }
        }

        private static void ValidarNombreBaseDatos(string databaseName)
        {
            bool nombreValido = databaseName.StartsWith("MindFit_", StringComparison.Ordinal)
                && databaseName.Length <= 128
                && databaseName.All(c => char.IsLetterOrDigit(c) || c == '_');

            if (!nombreValido)
            {
                throw new InvalidOperationException(
                    "El nombre de la base tenant no cumple el formato permitido.");
            }
        }

        private static async Task ValidarQueLaBaseNoExistaAsync(
            SqlConnectionStringBuilder tenantConnection,
            CancellationToken cancellationToken)
        {
            var masterConnection = new SqlConnectionStringBuilder(tenantConnection.ConnectionString)
            {
                InitialCatalog = "master"
            };

            await using var connection = new SqlConnection(masterConnection.ConnectionString);
            await connection.OpenAsync(cancellationToken);

            await using var command = connection.CreateCommand();
            command.CommandText = "SELECT DB_ID(@databaseName);";
            command.CommandType = CommandType.Text;
            command.Parameters.Add(
                new SqlParameter("@databaseName", SqlDbType.NVarChar, 128)
                {
                    Value = tenantConnection.InitialCatalog
                });

            object? result = await command.ExecuteScalarAsync(cancellationToken);

            if (result is not null && result != DBNull.Value)
            {
                throw new InvalidOperationException(
                    $"La base tenant '{tenantConnection.InitialCatalog}' ya existe. No se ejecutaron migraciones.");
            }
        }

        private static async Task VerificarMigracionesAsync(
            MindFitIntelligenceContext tenantContext,
            CancellationToken cancellationToken)
        {
            if (!await tenantContext.Database.CanConnectAsync(cancellationToken))
                throw new InvalidOperationException("No se pudo conectar a la base tenant después de migrarla.");

            var appliedMigrations = (await tenantContext.Database
                .GetAppliedMigrationsAsync(cancellationToken))
                .ToList();
            var pendingMigrations = (await tenantContext.Database
                .GetPendingMigrationsAsync(cancellationToken))
                .ToList();

            if (appliedMigrations.Count == 0)
                throw new InvalidOperationException("La base tenant no registra migraciones aplicadas.");

            if (pendingMigrations.Count > 0)
            {
                throw new InvalidOperationException(
                    "La base tenant conserva migraciones pendientes después del aprovisionamiento.");
            }
        }
    }
}
