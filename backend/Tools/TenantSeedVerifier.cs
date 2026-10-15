#:project ../MindFit_Intelligence_Backend/MindFit_Intelligence_Backend.csproj
#:property PublishAot=false

using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using MindFit_Intelligence_Backend.Models;
using MindFit_Intelligence_Backend.Services;

if (args.Length != 1)
{
    Console.Error.WriteLine("Uso: dotnet run --file TenantSeedVerifier.cs -- <connection-string>");
    return 1;
}

var options = new DbContextOptionsBuilder<MindFitIntelligenceContext>()
    .UseSqlServer(args[0])
    .Options;

using var loggerFactory = LoggerFactory.Create(builder => builder.AddSimpleConsole());
var seeder = new TenantInitialDataSeeder(
    loggerFactory.CreateLogger<TenantInitialDataSeeder>());

await using var context = new MindFitIntelligenceContext(options);

await seeder.SeedAsync(context);
await seeder.SeedAsync(context);

Console.WriteLine($"Grupos={await context.Grupos.CountAsync()}");
Console.WriteLine($"Permisos={await context.Permisos.CountAsync()}");
Console.WriteLine($"GrupoPermisos={await context.GrupoPermisos.CountAsync()}");
Console.WriteLine($"Formularios={await context.Formularios.CountAsync()}");
Console.WriteLine($"FormularioPermisos={await context.FormularioPermisos.CountAsync()}");
Console.WriteLine($"Dias={await context.Dias.CountAsync()}");
Console.WriteLine($"GruposMusculares={await context.GruposMusculares.CountAsync()}");
Console.WriteLine($"TiposEjercicio={await context.TiposEjercicios.CountAsync()}");
Console.WriteLine($"RangosHorarios={await context.RangosHorarios.CountAsync()}");
Console.WriteLine($"DiaRangosHorarios={await context.DiaRangosHorarios.CountAsync()}");

return 0;
