#:project ../MindFit_Intelligence_Backend/MindFit_Intelligence_Backend.csproj
#:property PublishAot=false

using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using MindFit_Intelligence_Backend.Models;
using MindFit_Intelligence_Backend.Services;

if (args.Length != 1)
{
    Console.Error.WriteLine(
        "Uso: dotnet run --file TenantExistingDatabaseVerifier.cs -- <connection-string>");
    return 1;
}

string connectionString = args[0];
var connectionBuilder = new SqlConnectionStringBuilder(connectionString);
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

var options = new DbContextOptionsBuilder<MindFitIntelligenceContext>()
    .UseSqlServer(connectionString)
    .Options;

await using var context = new MindFitIntelligenceContext(options);
int migrationsBefore = (await context.Database.GetAppliedMigrationsAsync()).Count();

using var loggerFactory = LoggerFactory.Create(builder => builder.AddSimpleConsole());
var seeder = new TenantInitialDataSeeder(
    loggerFactory.CreateLogger<TenantInitialDataSeeder>());
var provisioningService = new TenantProvisioningService(
    configuration,
    loggerFactory.CreateLogger<TenantProvisioningService>(),
    seeder);

bool existingDatabaseRejected = false;

try
{
    await provisioningService.CrearYAplicarMigracionesAsync(connectionString);
}
catch (InvalidOperationException ex) when (ex.Message.Contains("ya existe", StringComparison.Ordinal))
{
    existingDatabaseRejected = true;
}

context.ChangeTracker.Clear();
int migrationsAfter = (await context.Database.GetAppliedMigrationsAsync()).Count();

if (!existingDatabaseRejected || migrationsBefore != migrationsAfter)
{
    throw new InvalidOperationException(
        "La proteccion de la base existente no produjo el resultado esperado.");
}

Console.WriteLine($"Database={connectionBuilder.InitialCatalog}");
Console.WriteLine($"ExistingDatabaseRejected={existingDatabaseRejected}");
Console.WriteLine($"MigrationsBefore={migrationsBefore}");
Console.WriteLine($"MigrationsAfter={migrationsAfter}");

return 0;
