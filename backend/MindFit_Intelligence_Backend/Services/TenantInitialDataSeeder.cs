using Microsoft.EntityFrameworkCore;
using MindFit_Intelligence_Backend.Models;
using MindFit_Intelligence_Backend.Models.Enums;

namespace MindFit_Intelligence_Backend.Services
{
    public class TenantInitialDataSeeder
    {
        private static readonly (string Nombre, string Descripcion)[] GroupDefinitions =
        {
            ("Admin", "Migrado desde Usuario"),
            ("Asistente", "Gestion de turnos y socios"),
            ("Socio", "Acceso para clientes del gimnasio"),
            ("Entrenador", "Armar  rutina del socio")
        };

        private static readonly (string Codigo, string Descripcion)[] PermissionDefinitions =
        {
            ("AGREGAR_TURNO", "Permite la creación o reserva de nuevos turnos"),
            ("CANCELAR_TURNO", "Permite cancelar turnos previamente agendados"),
            ("VALIDAR_INGRESO", "Permite validar el acceso o entrada al establecimiento"),
            ("CREAR_USUARIO_SOCIO", "Permite la creación de nuevos usuarios tipo Socio (cliente)"),
            ("EDITAR_USUARIO_SOCIO", "Permite modificar la información de usuarios tipo Socio"),
            ("ELIMINAR_USUARIO_SOCIO", "Permite dar de baja usuarios tipo Socio"),
            ("ELIMINAR_USUARIO_SOCIO_DEFINITIVAMENTE", "Permite eliminar definitivamente del sistema a un Socio"),
            ("CAMBIAR_CONTRASENA_SOCIO", "Permite cambiar la contraseña de usuarios tipo Socio"),
            ("CREAR_USUARIO_RESPONSABLE", "Permite la creación de nuevos usuarios tipo Responsable (staff)"),
            ("EDITAR_USUARIO_RESPONSABLE", "Permite modificar la información de usuarios tipo Responsable"),
            ("ELIMINAR_USUARIO_RESPONSABLE_DEFINITIVAMENTE", "Permite eliminar definitivamente a un Responsable"),
            ("CAMBIAR_CONTRASENA_RESPONSABLE", "Permite cambiar la contraseña de usuarios tipo Responsable"),
            ("CREAR_GRUPO", "Permite la creación de nuevos grupos de permisos"),
            ("EDITAR_GRUPO", "Permite modificar los nombres o alcances de los grupos"),
            ("ELIMINAR_GRUPO", "Permite eliminar grupos de permisos del sistema"),
            ("CREAR_EQUIPAMIENTO", "Permite registrar nuevo equipamiento"),
            ("EDITAR_EQUIPAMIENTO", "Permite modificar información de equipamiento"),
            ("ELIMINAR_EQUIPAMIENTO", "Permite eliminar registros de equipamiento"),
            ("CREAR_MAQUINA", "Permite registrar nuevas máquinas en el sistema"),
            ("EDITAR_MAQUINA", "Permite modificar información de máquinas existentes"),
            ("ELIMINAR_MAQUINA", "Permite dar de baja máquinas del sistema"),
            ("CREAR_EJERCICIO", "Permite crear nuevos ejercicios en el catálogo"),
            ("EDITAR_EJERCICIO", "Permite modificar detalles de ejercicios existentes"),
            ("ELIMINAR_EJERCICIO", "Permite eliminar ejercicios del catálogo"),
            ("MODIFICAR_DIA_RH", "Permite modificar días y rangos horarios"),
            ("QUITAR_ENTRENADOR_DIA_RH", "Permite quitar a un entrenador asignado a un día y rango horario"),
            ("EDITAR_RUTINA", "Permite modificar las rutinas asignadas"),
            ("VER_HISTORIAL_RUTINA", "Permite visualizar el historial de rutinas del socio"),
            ("ELIMINAR_RUTINA", "Permite dar de baja o eliminar rutinas"),
            ("RECUPERAR_RUTINA", "Permite restaurar rutinas eliminadas anteriormente"),
            ("VER_AUDITORIA", "Permite consultar trazabilidad, sesiones y reportes de auditoria"),
            ("VER_REPORTES_GIMNASIO", "Permite consultar reportes, indicadores y estadisticas del gimnasio"),
            ("VER_MI_SUSCRIPCION", "Permite consultar y actualizar el estado de la suscripcion PayPal del gimnasio")
        };

        private static readonly IReadOnlyDictionary<string, string[]> GroupPermissionCodes =
            new Dictionary<string, string[]>
            {
                ["Admin"] = PermissionDefinitions.Select(p => p.Codigo).ToArray(),
                ["Asistente"] = new[]
                {
                    "AGREGAR_TURNO",
                    "CANCELAR_TURNO",
                    "VALIDAR_INGRESO",
                    "CREAR_USUARIO_SOCIO",
                    "EDITAR_USUARIO_SOCIO",
                    "ELIMINAR_USUARIO_SOCIO",
                    "ELIMINAR_USUARIO_SOCIO_DEFINITIVAMENTE",
                    "CAMBIAR_CONTRASENA_SOCIO"
                },
                ["Socio"] = Array.Empty<string>(),
                ["Entrenador"] = new[]
                {
                    "EDITAR_RUTINA",
                    "VER_HISTORIAL_RUTINA",
                    "ELIMINAR_RUTINA",
                    "RECUPERAR_RUTINA"
                }
            };

        private static readonly IReadOnlyDictionary<string, string[]> FormPermissionCodes =
            new Dictionary<string, string[]>
            {
                ["FORMULARIO_TURNOS_SOCIOS"] = new[]
                {
                    "AGREGAR_TURNO",
                    "CANCELAR_TURNO",
                    "VALIDAR_INGRESO",
                    "CREAR_USUARIO_SOCIO",
                    "EDITAR_USUARIO_SOCIO",
                    "ELIMINAR_USUARIO_SOCIO",
                    "ELIMINAR_USUARIO_SOCIO_DEFINITIVAMENTE",
                    "CAMBIAR_CONTRASENA_SOCIO"
                },
                ["FORMULARIO_GYM_USUARIOS"] = new[]
                {
                    "CREAR_USUARIO_RESPONSABLE",
                    "EDITAR_USUARIO_RESPONSABLE",
                    "ELIMINAR_USUARIO_RESPONSABLE_DEFINITIVAMENTE",
                    "CAMBIAR_CONTRASENA_RESPONSABLE"
                },
                ["FORMULARIO_GYM_PERMISOS"] = new[]
                {
                    "CREAR_GRUPO",
                    "EDITAR_GRUPO",
                    "ELIMINAR_GRUPO"
                },
                ["FORMULARIO_EQUIPAMIENTOS"] = new[]
                {
                    "CREAR_EQUIPAMIENTO",
                    "EDITAR_EQUIPAMIENTO",
                    "ELIMINAR_EQUIPAMIENTO"
                },
                ["FORMULARIO_MAQUINAS"] = new[]
                {
                    "CREAR_MAQUINA",
                    "EDITAR_MAQUINA",
                    "ELIMINAR_MAQUINA"
                },
                ["FORMULARIO_EJERCICIOS"] = new[]
                {
                    "CREAR_EJERCICIO",
                    "EDITAR_EJERCICIO",
                    "ELIMINAR_EJERCICIO"
                },
                ["FORMULARIO_GYM_HORARIOS"] = new[]
                {
                    "MODIFICAR_DIA_RH",
                    "QUITAR_ENTRENADOR_DIA_RH"
                },
                ["FORMULARIO_RUTINAS"] = new[]
                {
                    "EDITAR_RUTINA",
                    "VER_HISTORIAL_RUTINA",
                    "ELIMINAR_RUTINA",
                    "RECUPERAR_RUTINA"
                },
                ["FORMULARIO_AUDITORIA"] = new[]
                {
                    "VER_AUDITORIA"
                },
                ["FORMULARIO_REPORTES_GIMNASIO"] = new[]
                {
                    "VER_REPORTES_GIMNASIO"
                },
                ["FORMULARIO_MI_SUSCRIPCION"] = new[]
                {
                    "VER_MI_SUSCRIPCION"
                }
            };

        private static readonly string[] DayNames =
        {
            "Lunes",
            "Martes",
            "Miércoles",
            "Jueves",
            "Viernes",
            "Sábado",
            "Domingo"
        };

        private static readonly (Musculo Musculo, string IdMapaAnatomico)[] MuscleDefinitions =
        {
            (Musculo.Pecho, "pecho_01"),
            (Musculo.Espalda, "espalda_01"),
            (Musculo.Cuadriceps, "cuadriceps_01"),
            (Musculo.Biceps, "biceps_01"),
            (Musculo.Triceps, "triceps_01"),
            (Musculo.Gluteos, "gluteos_01"),
            (Musculo.Abdomen, "abdomen_01"),
            (Musculo.Hombros, "hombros_01"),
            (Musculo.Gemelos, "gemelos_01"),
            (Musculo.Antebrazos, "antebrazos_01"),
            (Musculo.Lumbares, "lumbares_01"),
            (Musculo.Isquiotibiales, "isquiotibiales_01")
        };

        private static readonly TipoDeEjercicio[] ExerciseTypes =
        {
            TipoDeEjercicio.Calentamiento,
            TipoDeEjercicio.Entrenamiento,
            TipoDeEjercicio.Estiramiento
        };

        private readonly ILogger<TenantInitialDataSeeder> _logger;

        public TenantInitialDataSeeder(ILogger<TenantInitialDataSeeder> logger)
        {
            _logger = logger;
        }

        public async Task SeedAsync(
            MindFitIntelligenceContext context,
            CancellationToken cancellationToken = default)
        {
            ArgumentNullException.ThrowIfNull(context);

            int addedEntities = await EnsureBaseEntitiesAsync(context, cancellationToken);
            int addedRelations = await EnsureRelationsAsync(context, cancellationToken);

            _logger.LogInformation(
                "Seed tenant completado. Entidades agregadas: {AddedEntities}. Relaciones agregadas: {AddedRelations}.",
                addedEntities,
                addedRelations);
        }

        private static async Task<int> EnsureBaseEntitiesAsync(
            MindFitIntelligenceContext context,
            CancellationToken cancellationToken)
        {
            int added = 0;

            var groupNames = GroupDefinitions.Select(g => g.Nombre).ToArray();
            var groups = await context.Grupos
                .Where(g => groupNames.Contains(g.Nombre))
                .ToDictionaryAsync(g => g.Nombre, cancellationToken);

            foreach (var definition in GroupDefinitions)
            {
                if (groups.ContainsKey(definition.Nombre))
                    continue;

                var group = new Grupo
                {
                    Nombre = definition.Nombre,
                    Descripcion = definition.Descripcion
                };
                groups.Add(group.Nombre, group);
                context.Grupos.Add(group);
                added++;
            }

            var permissionCodes = PermissionDefinitions.Select(p => p.Codigo).ToArray();
            var permissions = await context.Permisos
                .Where(p => permissionCodes.Contains(p.Codigo))
                .ToDictionaryAsync(p => p.Codigo, cancellationToken);

            foreach (var definition in PermissionDefinitions)
            {
                if (permissions.ContainsKey(definition.Codigo))
                    continue;

                var permission = new Permiso
                {
                    Codigo = definition.Codigo,
                    Descripcion = definition.Descripcion,
                    GrupoPermisos = new List<GrupoPermiso>(),
                    FormularioPermisos = new List<FormularioPermiso>()
                };
                permissions.Add(permission.Codigo, permission);
                context.Permisos.Add(permission);
                added++;
            }

            var formNames = FormPermissionCodes.Keys.ToArray();
            var forms = await context.Formularios
                .Where(f => formNames.Contains(f.NombreFormulario))
                .ToDictionaryAsync(f => f.NombreFormulario, cancellationToken);

            foreach (string formName in formNames)
            {
                if (forms.ContainsKey(formName))
                    continue;

                var form = new Formulario
                {
                    NombreFormulario = formName,
                    FormularioPermisos = new List<FormularioPermiso>()
                };
                forms.Add(form.NombreFormulario, form);
                context.Formularios.Add(form);
                added++;
            }

            var days = await context.Dias
                .Where(d => DayNames.Contains(d.NombreDia))
                .ToDictionaryAsync(d => d.NombreDia, cancellationToken);

            foreach (string dayName in DayNames)
            {
                if (days.ContainsKey(dayName))
                    continue;

                var day = new Dia { NombreDia = dayName };
                days.Add(day.NombreDia, day);
                context.Dias.Add(day);
                added++;
            }

            var muscleValues = MuscleDefinitions.Select(m => m.Musculo).ToArray();
            var muscles = await context.GruposMusculares
                .Where(m => muscleValues.Contains(m.NombreMusculo))
                .ToDictionaryAsync(m => m.NombreMusculo, cancellationToken);

            foreach (var definition in MuscleDefinitions)
            {
                if (muscles.ContainsKey(definition.Musculo))
                    continue;

                var muscle = new GrupoMuscular
                {
                    NombreMusculo = definition.Musculo,
                    IdMapaAnatomico = definition.IdMapaAnatomico
                };
                muscles.Add(muscle.NombreMusculo, muscle);
                context.GruposMusculares.Add(muscle);
                added++;
            }

            var exerciseTypes = await context.TiposEjercicios
                .Where(t => ExerciseTypes.Contains(t.NombreTipo))
                .ToDictionaryAsync(t => t.NombreTipo, cancellationToken);

            foreach (TipoDeEjercicio exerciseType in ExerciseTypes)
            {
                if (exerciseTypes.ContainsKey(exerciseType))
                    continue;

                var type = new TipoEjercicio { NombreTipo = exerciseType };
                exerciseTypes.Add(type.NombreTipo, type);
                context.TiposEjercicios.Add(type);
                added++;
            }

            var ranges = (await context.RangosHorarios.ToListAsync(cancellationToken))
                .ToDictionary(r => (r.HoraDesde, r.HoraHasta));

            for (int hour = 0; hour < 24; hour++)
            {
                var key = (TimeSpan.FromHours(hour), TimeSpan.FromHours((hour + 1) % 24));
                if (ranges.ContainsKey(key))
                    continue;

                var range = new RangoHorario
                {
                    HoraDesde = key.Item1,
                    HoraHasta = key.Item2
                };
                ranges.Add(key, range);
                context.RangosHorarios.Add(range);
                added++;
            }

            await context.SaveChangesAsync(cancellationToken);
            return added;
        }

        private static async Task<int> EnsureRelationsAsync(
            MindFitIntelligenceContext context,
            CancellationToken cancellationToken)
        {
            int added = 0;

            var groups = await context.Grupos
                .Where(g => GroupPermissionCodes.Keys.Contains(g.Nombre))
                .ToDictionaryAsync(g => g.Nombre, cancellationToken);
            var permissions = await context.Permisos
                .Where(p => PermissionDefinitions.Select(d => d.Codigo).Contains(p.Codigo))
                .ToDictionaryAsync(p => p.Codigo, cancellationToken);
            var forms = await context.Formularios
                .Where(f => FormPermissionCodes.Keys.Contains(f.NombreFormulario))
                .ToDictionaryAsync(f => f.NombreFormulario, cancellationToken);

            var existingGroupPermissionPairs = (await context.GrupoPermisos
                .Select(gp => new { gp.IdGrupo, gp.IdPermiso })
                .ToListAsync(cancellationToken))
                .Select(gp => (gp.IdGrupo, gp.IdPermiso))
                .ToHashSet();

            foreach (var definition in GroupPermissionCodes)
            {
                Grupo group = groups[definition.Key];

                foreach (string permissionCode in definition.Value)
                {
                    Permiso permission = permissions[permissionCode];
                    if (!existingGroupPermissionPairs.Add((group.IdGrupo, permission.IdPermiso)))
                        continue;

                    context.GrupoPermisos.Add(new GrupoPermiso
                    {
                        IdGrupo = group.IdGrupo,
                        IdPermiso = permission.IdPermiso
                    });
                    added++;
                }
            }

            var existingFormPermissionPairs = (await context.FormularioPermisos
                .Select(fp => new { fp.IdFormulario, fp.IdPermiso })
                .ToListAsync(cancellationToken))
                .Select(fp => (fp.IdFormulario, fp.IdPermiso))
                .ToHashSet();

            foreach (var definition in FormPermissionCodes)
            {
                Formulario form = forms[definition.Key];

                foreach (string permissionCode in definition.Value)
                {
                    Permiso permission = permissions[permissionCode];
                    if (!existingFormPermissionPairs.Add((form.IdFormulario, permission.IdPermiso)))
                        continue;

                    context.FormularioPermisos.Add(new FormularioPermiso
                    {
                        IdFormulario = form.IdFormulario,
                        IdPermiso = permission.IdPermiso
                    });
                    added++;
                }
            }

            var days = await context.Dias
                .Where(d => DayNames.Contains(d.NombreDia))
                .ToListAsync(cancellationToken);
            var ranges = await context.RangosHorarios.ToListAsync(cancellationToken);
            var existingDayRangePairs = (await context.DiaRangosHorarios
                .Select(drh => new { drh.IdDia, drh.IdRangoHorario })
                .ToListAsync(cancellationToken))
                .Select(drh => (drh.IdDia, drh.IdRangoHorario))
                .ToHashSet();

            foreach (Dia day in days)
            {
                foreach (RangoHorario range in ranges)
                {
                    if (!existingDayRangePairs.Add((day.IdDia, range.IdRangoHorario)))
                        continue;

                    context.DiaRangosHorarios.Add(new DiaRangoHorario
                    {
                        IdDia = day.IdDia,
                        IdRangoHorario = range.IdRangoHorario,
                        CupoMaximo = 0
                    });
                    added++;
                }
            }

            await context.SaveChangesAsync(cancellationToken);
            return added;
        }
    }
}
