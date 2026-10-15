using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Components;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;
using MindFit_Intelligence_Backend.Authorization;
using MindFit_Intelligence_Backend.Automappers;
using MindFit_Intelligence_Backend.DTOs.Personas;
using MindFit_Intelligence_Backend.DTOs.Usuarios;
using MindFit_Intelligence_Backend.Models;
using MindFit_Intelligence_Backend.Repository;
using MindFit_Intelligence_Backend.Repository.Interfaces;
using MindFit_Intelligence_Backend.Services;
using MindFit_Intelligence_Backend.Services.Interfaces;
using FluentValidation;
using System.Text;
using MindFit_Intelligence_Backend.Models.Master;
using MindFit_Intelligence_Backend.Middleware;
using MindFit_Intelligence_Backend.Swagger;

var builder = WebApplication.CreateBuilder(args);

builder.Configuration.AddJsonFile("appsettings.Local.json", optional: true, reloadOnChange: true);

// Add services to the container.
// Services
builder.Services.AddScoped<IPersonaResponsableService, PersonaResponsableService>();
builder.Services.AddScoped<IRutinaService, RutinaService>();
builder.Services.AddScoped<IRutinaIaService, RutinaIaService>();
builder.Services.AddScoped<IAuditoriaService, AuditoriaService>();
builder.Services.AddScoped<IReporteService, ReporteService>();
builder.Services.AddScoped<ISocioInsightsService, SocioInsightsService>();
builder.Services.AddHttpClient<IOpenAiRutinaClient, OpenAiRutinaClient>();
builder.Services.AddHttpClient<IPayPalService, PayPalService>((serviceProvider, client) =>
{
    var configuration = serviceProvider.GetRequiredService<IConfiguration>();
    var environment = configuration["PayPal:Environment"];
    var baseUrl = string.Equals(environment, "Live", StringComparison.OrdinalIgnoreCase)
        ? "https://api-m.paypal.com"
        : "https://api-m.sandbox.paypal.com";

    client.BaseAddress = new Uri(baseUrl);
});
builder.Services.AddScoped<IUsuarioService, UsuarioService>();
builder.Services.AddScoped<IDiaService, DiaService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IGrupoService, GrupoService>();
builder.Services.AddScoped<IPermisoService, PermisoService>();
builder.Services.AddScoped<IFormularioService, FormularioService>();
builder.Services.AddScoped<IPersonaSocioService, PersonaSocioService>();
builder.Services.AddScoped<ICuotaService, CuotaService>();
builder.Services.AddScoped<ITurnoService, TurnoService>();
builder.Services.AddScoped<IDiaRangoHorarioService, DiaRangoHorarioService>();
builder.Services.AddScoped<IEmailService, SmtpEmailService>();
builder.Services.AddScoped<IMaquinaService, MaquinaService>();
builder.Services.AddScoped<IEquipamientoService, EquipamientoService>();
builder.Services.AddScoped<IEjercicioService, EjercicioService>();
builder.Services.AddScoped<IGrupoMuscularService, GrupoMuscularService>();
builder.Services.AddScoped<ITipoEjercicioService, TipoEjercicioService>();
builder.Services.AddScoped<IRangoHorarioService, RangoHorarioService>();
builder.Services.AddScoped<ICurrentUserService, CurrentUserService>();

builder.Services.AddScoped<IGymPublicoService, GymPublicoService>();
builder.Services.AddScoped<TenantProvisioningService>();
builder.Services.AddScoped<TenantInitialDataSeeder>();
builder.Services.AddHostedService<SubscriptionVerificationHostedService>();

// Repositories
builder.Services.AddScoped<IPersonaResponsableRepository, PersonaResponsableRepository>();
builder.Services.AddScoped<IRutinaRepository, RutinaRepository>();
builder.Services.AddScoped<IAuditoriaRepository, AuditoriaRepository>();
builder.Services.AddScoped<IPersonaSocioRepository, PersonaSocioRepository>();
builder.Services.AddScoped<IUsuarioRepository, UsuarioRepository>();
builder.Services.AddScoped<IGrupoRepository, GrupoRepository>();
builder.Services.AddScoped<IPermisoRepository, PermisoRepository>();
builder.Services.AddScoped<IFormularioRepository, FormularioRepository>();
builder.Services.AddScoped<IDiaRepository, DiaRepository>();
builder.Services.AddScoped<ICuotaRepository, CuotaRepository>();
builder.Services.AddScoped<ITurnoRepository, TurnoRepository>();
builder.Services.AddScoped<IDiaRangoHorarioRepository, DiaRangoHorarioRepository>();
builder.Services.AddScoped<IDiaRangoHorarioResponsableRepository, DiaRangoHorarioResponsableRepository>();
builder.Services.AddScoped<ICupoFechaRepository, CupoFechaRepository>();
builder.Services.AddScoped<IMaquinaRepository, MaquinaRepository>();
builder.Services.AddScoped<IEquipamientoRepository, EquipamientoRepository>();
builder.Services.AddScoped<IEjercicioRepository, EjercicioRepository>();
builder.Services.AddScoped<IRangoHorarioRepository, RangoHorarioRepository>();
builder.Services.AddScoped<IGrupoMuscularRepository, GrupoMuscularRepository>();
builder.Services.AddScoped<ITipoEjercicioRepository, TipoEjercicioRepository>();
builder.Services.AddScoped<IGymRepository, GymRepository>();
builder.Services.AddScoped<IUsuarioMasterRepository, UsuarioMasterRepository>();

// Infra: Tenant services
builder.Services.AddScoped<ITenantContext, TenantContext>();
builder.Services.AddScoped<ITenantResolver, TenantResolver>();
builder.Services.AddHttpContextAccessor();

// Entity Framework - Master DB (ya creado)
builder.Services.AddDbContext<MindFitMasterContext>(options =>
{
    options.UseSqlServer(builder.Configuration.GetConnectionString("MasterConnection"));
});

// Entity Framework - Tenant DbContext configurado din�micamente usando ITenantContext
builder.Services.AddDbContext<MindFitIntelligenceContext>((serviceProvider, options) =>
{
    // Intentamos resolver la connection string desde el TenantContext (scoped)
    var tenantContext = serviceProvider.GetService<ITenantContext>();
    var configuration = serviceProvider.GetRequiredService<IConfiguration>();

    var connectionString = tenantContext?.ConnectionString
        ?? configuration.GetConnectionString("StoreConnection"); // fallback a la conexi�n por defecto

    options.UseSqlServer(connectionString);
});

// AutoMapper
builder.Services.AddAutoMapper(cfg => cfg.AddProfile<MappingProfile>(), typeof(MappingProfile).Assembly);

// FluentValidation - Registro autom�tico de todos los validadores del ensamblado
builder.Services.AddValidatorsFromAssemblyContaining<Program>();

// Antes era solo builder.Services.AddControllers();
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        // Esto hace que los Enums (Genero, Plan, Estado) se env�en como Texto al Front
        options.JsonSerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());
    });

// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    // Esto ayuda a que Swagger entienda que vas a usar Strings para los Enums
    c.DescribeAllParametersInCamelCase();

    // Registrar el OperationFilter que a�ade X-Gym-Id en Swagger UI
    c.OperationFilter<TenantHeaderOperationFilter>();
});

// JWT Authentication
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)

    // Se configura c�mo se validar�n los tokens JWT que lleguen a la API.
    .AddJwtBearer(options =>
    {
        // Se establecen los par�metros que definir�n las reglas de validaci�n del token.
        options.TokenValidationParameters = new TokenValidationParameters
        {
            // Indica que se debe validar qui�n emiti� el token (Issuer).
            ValidateIssuer = true,

            // Define el emisor v�lido del token (por ejemplo, tu propio servidor o aplicaci�n).
            ValidIssuer = builder.Configuration["AppSettings:Issuer"],

            // Indica que se debe validar la audiencia del token (para qui�n fue emitido).
            ValidateAudience = true,

            // Define la audiencia v�lida (por ejemplo, tu frontend o aplicaci�n cliente).
            ValidAudience = builder.Configuration["AppSettings:Audience"],

            // Indica que se debe verificar que el token no haya expirado.
            ValidateLifetime = true,

            // Clave secreta usada para validar la firma del token.
            // Debe ser la misma que se us� para generarlo.
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(builder.Configuration["AppSettings:Token"]!)),

            // Indica que se debe validar la firma del token (para evitar tokens falsificados).
            ValidateIssuerSigningKey = true
        };
    });

builder.Services.AddAuthorization(options =>
{
    //// Pol�tica para el Socio basada puramente en su Rol
    /// M�dulo Gesti�n de Turno � Socio
    options.AddPolicy("SoloSocio", policy =>
        policy.RequireRole("Socio"));

    //// Pol�tica para el Responsable basada en Requerimientos
    /// M�dulo Gesti�n de Turno � Asistente --> FORMULARIO_TURNOS_SOCIOS
    options.AddPolicy("AgregarTurno", policy =>
    policy.Requirements.Add(new PermisoRequirement("AGREGAR_TURNO")));

    options.AddPolicy("CancelarTurno", policy =>
        policy.Requirements.Add(new PermisoRequirement("CANCELAR_TURNO")));

    options.AddPolicy("ValidarIngreso", policy =>
        policy.Requirements.Add(new PermisoRequirement("VALIDAR_INGRESO")));
    // Usuario Socio
    options.AddPolicy("CrearUsuarioSocio", policy =>
        policy.Requirements.Add(new PermisoRequirement("CREAR_USUARIO_SOCIO")));

    options.AddPolicy("EditarUsuarioSocio", policy =>
        policy.Requirements.Add(new PermisoRequirement("EDITAR_USUARIO_SOCIO")));

    options.AddPolicy("EliminarUsuarioSocio", policy =>
        policy.Requirements.Add(new PermisoRequirement("ELIMINAR_USUARIO_SOCIO")));

    options.AddPolicy("EliminarUsuarioSocioDefinitivamente", policy =>
    policy.Requirements.Add(new PermisoRequirement("ELIMINAR_USUARIO_SOCIO_DEFINITIVAMENTE")));
    // Auth
    options.AddPolicy("CambiarContrasenaSocio", policy =>
        policy.Requirements.Add(new PermisoRequirement("CAMBIAR_CONTRASENA_SOCIO")));

    /// M�dulo Gesti�n del Gimnasio � Usuarios --> FORMULARIO_GYM_USUARIOS
    // Usuario
    options.AddPolicy("CrearUsuarioResponsable", policy =>
        policy.Requirements.Add(new PermisoRequirement("CREAR_USUARIO_RESPONSABLE")));

    options.AddPolicy("EditarUsuarioResponsable", policy =>
        policy.Requirements.Add(new PermisoRequirement("EDITAR_USUARIO_RESPONSABLE")));

    options.AddPolicy("EliminarUsuarioResponsableDefinitivamente", policy =>
        policy.Requirements.Add(new PermisoRequirement("ELIMINAR_USUARIO_RESPONSABLE_DEFINITIVAMENTE")));
    // Auth
    options.AddPolicy("CambiarContrasenaResponsable", policy =>
        policy.Requirements.Add(new PermisoRequirement("CAMBIAR_CONTRASENA_RESPONSABLE")));

    /// M�dulo Gesti�n del Gimnasio � Permisos --> FORMULARIO_GYM_PERMISOS
    // Grupo
    options.AddPolicy("CrearGrupo", policy =>
        policy.Requirements.Add(new PermisoRequirement("CREAR_GRUPO")));

    options.AddPolicy("EditarGrupo", policy =>
        policy.Requirements.Add(new PermisoRequirement("EDITAR_GRUPO")));

    options.AddPolicy("EliminarGrupo", policy =>
        policy.Requirements.Add(new PermisoRequirement("ELIMINAR_GRUPO")));

    /// M�dulo Gesti�n del Gimnasio � Equipamientos M�quinas y Ejercicios
    // Equipamiento --> FORMULARIO_EQUIPAMIENTOS
    options.AddPolicy("CrearEquipamiento", policy =>
        policy.Requirements.Add(new PermisoRequirement("CREAR_EQUIPAMIENTO")));

    options.AddPolicy("EditarEquipamiento", policy =>
        policy.Requirements.Add(new PermisoRequirement("EDITAR_EQUIPAMIENTO")));

    options.AddPolicy("EliminarEquipamiento", policy =>
        policy.Requirements.Add(new PermisoRequirement("ELIMINAR_EQUIPAMIENTO")));
    // M�quina --> FORMULARIO_MAQUINAS
    options.AddPolicy("CrearMaquina", policy =>
        policy.Requirements.Add(new PermisoRequirement("CREAR_MAQUINA")));

    options.AddPolicy("EditarMaquina", policy =>
        policy.Requirements.Add(new PermisoRequirement("EDITAR_MAQUINA")));

    options.AddPolicy("EliminarMaquina", policy =>
        policy.Requirements.Add(new PermisoRequirement("ELIMINAR_MAQUINA")));
    // Ejercicio --> FORMULARIO_EJERCICIOS
    options.AddPolicy("CrearEjercicio", policy =>
        policy.Requirements.Add(new PermisoRequirement("CREAR_EJERCICIO")));

    options.AddPolicy("EditarEjercicio", policy =>
        policy.Requirements.Add(new PermisoRequirement("EDITAR_EJERCICIO")));

    options.AddPolicy("EliminarEjercicio", policy =>
        policy.Requirements.Add(new PermisoRequirement("ELIMINAR_EJERCICIO")));

    /// M�dulo Gesti�n del Gimnasio � Rangos Horarios --> FORMULARIO_GYM_HORARIOS
    options.AddPolicy("ModificarDiaRangoHorario", policy =>
    policy.Requirements.Add(new PermisoRequirement("MODIFICAR_DIA_RH")));

    options.AddPolicy("QuitarEntrenadorDiaRangoHorario", policy =>
        policy.Requirements.Add(new PermisoRequirement("QUITAR_ENTRENADOR_DIA_RH")));

    /// M�dulo de Gesti�n de Rutinas --> FORMULARIO_RUTINAS
    // Rutina
    options.AddPolicy("EditarRutina", policy =>
        policy.Requirements.Add(new PermisoRequirement("EDITAR_RUTINA")));

    options.AddPolicy("VerHistorialRutina", policy =>
        policy.Requirements.Add(new PermisoRequirement("VER_HISTORIAL_RUTINA")));

    options.AddPolicy("EliminarRutina", policy =>
        policy.Requirements.Add(new PermisoRequirement("ELIMINAR_RUTINA")));

    options.AddPolicy("RecuperarRutina", policy =>
        policy.Requirements.Add(new PermisoRequirement("RECUPERAR_RUTINA")));

    /// Modulo de Auditoria --> FORMULARIO_AUDITORIA
    options.AddPolicy("VerAuditoria", policy =>
        policy.Requirements.Add(new PermisoRequirement("VER_AUDITORIA")));

    /// Modulo de Reportes --> FORMULARIO_REPORTES_GIMNASIO
    options.AddPolicy("VerReportesGimnasio", policy =>
        policy.Requirements.Add(new PermisoRequirement("VER_REPORTES_GIMNASIO")));

    /// Modulo Mi suscripcion --> FORMULARIO_MI_SUSCRIPCION
    options.AddPolicy("VerMiSuscripcion", policy =>
        policy.Requirements.Add(new PermisoRequirement("VER_MI_SUSCRIPCION")));

    // No implementados en el front
    /*
    options.AddPolicy("EliminarCuota", policy =>
        policy.Requirements.Add(new PermisoRequirement("ELIMINAR_CUOTA")));
    */
});

builder.Services.AddScoped<IAuthorizationHandler, PermisoHandler>();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

// Authentication MUST run before TenantMiddleware so claims are populated when middleware reads them
app.UseAuthentication();

// Tenant middleware: resuelve y guarda en ITenantContext la connection string por request
app.UseMiddleware<TenantMiddleware>();
app.UseMiddleware<SubscriptionAccessMiddleware>();

app.UseAuthorization();

app.MapControllers();

app.Run();
