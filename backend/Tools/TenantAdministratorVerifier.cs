#:project ../MindFit_Intelligence_Backend/MindFit_Intelligence_Backend.csproj
#:property PublishAot=false

using Microsoft.AspNetCore.Identity;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using MindFit_Intelligence_Backend.DTOs.Gyms;
using MindFit_Intelligence_Backend.Models;
using MindFit_Intelligence_Backend.Services;

if (args.Length != 2)
{
    Console.Error.WriteLine(
        "Uso: dotnet run --file TenantAdministratorVerifier.cs -- <connection-string> <username>");
    return 1;
}

string? password = Environment.GetEnvironmentVariable("MINDFIT_E4_PASSWORD");
if (string.IsNullOrWhiteSpace(password))
{
    Console.Error.WriteLine("Falta la variable de entorno MINDFIT_E4_PASSWORD.");
    return 1;
}

string connectionString = args[0];
string username = args[1];
var templateBuilder = new SqlConnectionStringBuilder(connectionString)
{
    InitialCatalog = "{0}"
};

IConfiguration configuration = new ConfigurationBuilder()
    .AddInMemoryCollection(new Dictionary<string, string?>
    {
        ["ConnectionStrings:TenantTemplate"] = templateBuilder.ConnectionString
    })
    .Build();

using var loggerFactory = LoggerFactory.Create(builder => builder.AddSimpleConsole());
var seeder = new TenantInitialDataSeeder(
    loggerFactory.CreateLogger<TenantInitialDataSeeder>());
var provisioningService = new TenantProvisioningService(
    configuration,
    loggerFactory.CreateLogger<TenantProvisioningService>(),
    seeder);

var administratorDto = new UsuarioMasterInsertDto
{
    Username = username,
    Password = password,
    PersonaResponsable = new PersonaResponsableMasterInsertDto
    {
        Nombre = "Admin",
        Apellido = "Validacion E4",
        Email = "admin.e4@validation.local",
        Telefono = "0000000000",
        Direccion = "Entorno de validacion",
        Ciudad = "Buenos Aires",
        TipoDocumento = "DNI",
        NroDocumento = "E4000001"
    }
};

await provisioningService.InicializarDatosYAdministradorAsync(
    connectionString,
    administratorDto);

var options = new DbContextOptionsBuilder<MindFitIntelligenceContext>()
    .UseSqlServer(connectionString)
    .Options;

await using var context = new MindFitIntelligenceContext(options);
Usuario administrator = await context.Usuarios
    .Include(u => u.PersonaResponsable)
    .Include(u => u.UsuarioGrupos)
        .ThenInclude(ug => ug.Grupo)
            .ThenInclude(g => g.GrupoPermisos)
    .SingleAsync(u => u.Username == username);

PasswordVerificationResult hashResult = new PasswordHasher<Usuario>()
    .VerifyHashedPassword(administrator, administrator.PasswordHash, password);
bool hasAdminGroup = administrator.UsuarioGrupos.Count == 1
    && administrator.UsuarioGrupos.Single().Grupo.Nombre == "Admin";
int permissionCount = administrator.UsuarioGrupos
    .SelectMany(ug => ug.Grupo.GrupoPermisos)
    .Select(gp => gp.IdPermiso)
    .Distinct()
    .Count();

if (administrator.PersonaResponsable is null
    || !hasAdminGroup
    || permissionCount != 30
    || hashResult == PasswordVerificationResult.Failed
    || administrator.RefreshToken is not null)
{
    throw new InvalidOperationException("La verificacion del administrador tenant fallo.");
}

int usersBeforeDuplicateAttempt = await context.Usuarios.CountAsync();
bool duplicateRejected = false;

try
{
    await provisioningService.InicializarDatosYAdministradorAsync(
        connectionString,
        administratorDto);
}
catch (InvalidOperationException)
{
    duplicateRejected = true;
}

context.ChangeTracker.Clear();
int usersAfterDuplicateAttempt = await context.Usuarios.CountAsync();
if (!duplicateRejected || usersAfterDuplicateAttempt != usersBeforeDuplicateAttempt)
{
    throw new InvalidOperationException("La prueba de rollback ante username duplicado fallo.");
}

Console.WriteLine($"UsuarioCreado={administrator.Username}");
Console.WriteLine($"PersonaResponsable={administrator.PersonaResponsable.IdUsuario}");
Console.WriteLine($"GrupoAdmin={hasAdminGroup}");
Console.WriteLine($"PermisosEfectivos={permissionCount}");
Console.WriteLine($"PasswordHashValido={hashResult != PasswordVerificationResult.Failed}");
Console.WriteLine($"RefreshTokenNulo={administrator.RefreshToken is null}");
Console.WriteLine($"DuplicadoRechazado={duplicateRejected}");
Console.WriteLine($"UsuariosTrasRollback={usersAfterDuplicateAttempt}");

return 0;
