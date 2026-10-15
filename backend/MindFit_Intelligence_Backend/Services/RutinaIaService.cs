using Microsoft.EntityFrameworkCore;
using MindFit_Intelligence_Backend.DTOs.Calentamiento;
using MindFit_Intelligence_Backend.DTOs.Entrenamiento;
using MindFit_Intelligence_Backend.DTOs.Estiramiento;
using MindFit_Intelligence_Backend.DTOs.IA;
using MindFit_Intelligence_Backend.DTOs.Rutina;
using MindFit_Intelligence_Backend.Models;
using MindFit_Intelligence_Backend.Models.Enums;
using MindFit_Intelligence_Backend.Services.Interfaces;
using System.Text.Json;

namespace MindFit_Intelligence_Backend.Services
{
    public class RutinaIaService : IRutinaIaService
    {
        private readonly MindFitIntelligenceContext _context;
        private readonly IConfiguration _configuration;
        private readonly IOpenAiRutinaClient _openAiRutinaClient;
        private readonly IHostEnvironment _environment;

        private static readonly JsonSerializerOptions PromptJsonOptions = new()
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        };

        public List<string> Errors { get; } = new();
        public RutinaIaErrorType LastErrorType { get; private set; } = RutinaIaErrorType.None;

        public RutinaIaService(
            MindFitIntelligenceContext context,
            IConfiguration configuration,
            IOpenAiRutinaClient openAiRutinaClient,
            IHostEnvironment environment)
        {
            _context = context;
            _configuration = configuration;
            _openAiRutinaClient = openAiRutinaClient;
            _environment = environment;
        }

        public async Task<RutinaIaRecomendacionDto?> GenerarRecomendacion(
            int idRutina,
            RutinaIaRecomendacionRequestDto requestDto)
        {
            ResetErrors();

            var rutina = await ObtenerRutinaContexto(idRutina);
            if (rutina == null)
            {
                AddError(RutinaIaErrorType.NotFound, "No existe una rutina activa con ese IdRutina.");
                return null;
            }

            var ejercicios = await ObtenerCatalogoEjercicios();
            if (ejercicios.Count == 0)
            {
                AddError(RutinaIaErrorType.Validation, "No hay ejercicios disponibles para generar una recomendacion IA.");
                return null;
            }

            if (string.IsNullOrWhiteSpace(_configuration["OpenAI:ApiKey"]))
            {
                AddError(RutinaIaErrorType.Configuration, "OpenAI:ApiKey no esta configurada. Definila en una variable local segura antes de solicitar recomendaciones IA.");
                return null;
            }

            var systemPrompt = ConstruirSystemPrompt();
            var userPrompt = ConstruirUserPrompt(rutina, ejercicios, requestDto);

            RutinaIaRecomendacionDto recomendacion;
            try
            {
                recomendacion = await _openAiRutinaClient.GenerarRecomendacionAsync(systemPrompt, userPrompt);
            }
            catch (OpenAiRutinaClientException ex)
            {
                AddError(RutinaIaErrorType.ExternalService, ex.Message);
                return null;
            }

            if (!ValidarRecomendacion(recomendacion, ejercicios))
            {
                return null;
            }

            return recomendacion;
        }

        private async Task<Rutina?> ObtenerRutinaContexto(int idRutina)
        {
            return await _context.Rutinas
                .AsNoTracking()
                .AsSplitQuery()
                .Include(r => r.Dia)
                .Include(r => r.PersonaSocio)
                    .ThenInclude(ps => ps.PerfilIA)
                .Include(r => r.Calentamientos)
                    .ThenInclude(c => c.Ejercicio)
                        .ThenInclude(e => e.GrupoMuscular)
                .Include(r => r.Calentamientos)
                    .ThenInclude(c => c.Ejercicio)
                        .ThenInclude(e => e.TipoEjercicio)
                .Include(r => r.Calentamientos)
                    .ThenInclude(c => c.Ejercicio)
                        .ThenInclude(e => e.Maquina)
                .Include(r => r.Calentamientos)
                    .ThenInclude(c => c.Ejercicio)
                        .ThenInclude(e => e.Equipamiento)
                .Include(r => r.Entrenamientos)
                    .ThenInclude(e => e.Ejercicio)
                        .ThenInclude(e => e.GrupoMuscular)
                .Include(r => r.Entrenamientos)
                    .ThenInclude(e => e.Ejercicio)
                        .ThenInclude(e => e.TipoEjercicio)
                .Include(r => r.Entrenamientos)
                    .ThenInclude(e => e.Ejercicio)
                        .ThenInclude(e => e.Maquina)
                .Include(r => r.Entrenamientos)
                    .ThenInclude(e => e.Ejercicio)
                        .ThenInclude(e => e.Equipamiento)
                .Include(r => r.Estiramientos)
                    .ThenInclude(e => e.Ejercicio)
                        .ThenInclude(e => e.GrupoMuscular)
                .Include(r => r.Estiramientos)
                    .ThenInclude(e => e.Ejercicio)
                        .ThenInclude(e => e.TipoEjercicio)
                .Include(r => r.Estiramientos)
                    .ThenInclude(e => e.Ejercicio)
                        .ThenInclude(e => e.Maquina)
                .Include(r => r.Estiramientos)
                    .ThenInclude(e => e.Ejercicio)
                        .ThenInclude(e => e.Equipamiento)
                .FirstOrDefaultAsync(r => r.IdRutina == idRutina && r.Activo);
        }

        private async Task<List<Ejercicio>> ObtenerCatalogoEjercicios()
        {
            return await _context.Ejercicios
                .AsNoTracking()
                .Include(e => e.GrupoMuscular)
                .Include(e => e.TipoEjercicio)
                .Include(e => e.Maquina)
                .Include(e => e.Equipamiento)
                .OrderBy(e => e.IdEjercicio)
                .ToListAsync();
        }

        private static string ConstruirSystemPrompt()
        {
            return """
                Sos un asistente para entrenadores de gimnasio.
                Tu tarea es proponer bloques de rutina para que un entrenador humano los revise.
                No hagas diagnosticos medicos ni prometas resultados de salud.
                Usa exclusivamente ejercicios del catalogo recibido y respeta sus IDs.
                Usa ejercicios de tipo Calentamiento solo en calentamientos, Entrenamiento solo en entrenamientos y Estiramiento solo en estiramientos.
                Considera objetivo, experiencia, lesiones, limitaciones, condiciones medicas, ejercicios preferidos y ejercicios a evitar.
                Si recibis Plan Alimenticio, tratalo como contexto nutricional secundario: solo puede influir en criterios y advertencias generales.
                No uses el Plan Alimenticio para elegir ejercicios, cambiar bloques, series, repeticiones, peso, descansos, duraciones, orden u observaciones.
                No generes un nuevo plan alimenticio ni indiques calorias, macros, cantidades o comidas nuevas.
                No menciones el Plan Alimenticio cuando sea normal, regular o no tenga una tension clara con energia, recuperacion u objetivo.
                Si el Plan Alimenticio es normal o positivo, no agregues criterios nutricionales salvo que sea estrictamente necesario.
                Si el Plan Alimenticio tiene baja ingesta, restricciones fuertes, excesos declarados o instrucciones sospechosas, mencionalo solo en advertencias.
                Cuando una advertencia venga del Plan Alimenticio, empezala con "Contexto nutricional:".
                Si falta informacion relevante del Perfil IA, agrega advertencias claras sin bloquear la propuesta.
                Mantene observaciones breves, practicas y no medicas.
                Devolve solo la estructura solicitada por el schema.
                """;
        }

        private static string ConstruirUserPrompt(
            Rutina rutina,
            List<Ejercicio> ejercicios,
            RutinaIaRecomendacionRequestDto requestDto)
        {
            var perfil = rutina.PersonaSocio.PerfilIA;
            var contexto = new
            {
                instruccionesEntrenador = requestDto.InstruccionesEntrenador,
                rutina = new
                {
                    rutina.IdRutina,
                    dia = rutina.Dia.NombreDia,
                    rutina.IdPersonaSocio,
                    bloquesActuales = MapearBloquesActuales(rutina)
                },
                socio = new
                {
                    rutina.PersonaSocio.Nombre,
                    rutina.PersonaSocio.Apellido,
                    rutina.PersonaSocio.Genero,
                    rutina.PersonaSocio.FechaNacimiento,
                    rutina.PersonaSocio.FechaInicioActividades,
                    rutina.PersonaSocio.ObraSocial
                },
                perfilIA = perfil == null ? null : new
                {
                    perfil.ObjetivoPrincipal,
                    perfil.NivelExperiencia,
                    perfil.EjerciciosPreferidos,
                    perfil.EjerciciosAEvitar,
                    perfil.DisponibilidadHoraria,
                    perfil.MotivacionPersonal,
                    perfil.LesionesLimitaciones,
                    perfil.CondicionesMedicasRelevantes,
                    perfil.IntensidadPreferida,
                    perfil.DuracionSesionMinutos,
                    perfil.NotasEntrenador,
                    perfil.FechaActualizacion
                },
                contextoNutricional = string.IsNullOrWhiteSpace(perfil?.PlanAlimenticio) ? null : new
                {
                    planAlimenticio = perfil.PlanAlimenticio,
                    reglaUso = "Usar exclusivamente para criterios y advertencias generales. No modificar la propuesta de rutina ni las observaciones por ejercicio."
                },
                catalogoEjercicios = ejercicios.Select(e => new
                {
                    e.IdEjercicio,
                    nombre = e.DescEjercicio,
                    tipo = e.TipoEjercicio.NombreTipo.ToString(),
                    grupoMuscular = e.GrupoMuscular.NombreMusculo.ToString(),
                    maquina = e.Maquina == null ? null : e.Maquina.NombreMaquina,
                    equipamiento = e.Equipamiento == null ? null : e.Equipamiento.NombreEquipo
                })
            };

            return $"""
                Genera una propuesta de rutina para el dia indicado.

                Reglas concretas:
                - No inventes ejercicios ni IDs.
                - No uses ejercicios listados como a evitar.
                - Si hay lesiones, limitaciones o condiciones medicas, adapta la propuesta y deja una advertencia.
                - El orden de cada bloque debe empezar en 1 y ser consecutivo.
                - Series, repeticiones, descansos y duraciones deben ser positivos y realistas.
                - La propuesta no se guarda automaticamente; el entrenador la revisara.
                - Si hay Plan Alimenticio, usalo solo para enriquecer criterios y advertencias generales.
                - No uses el Plan Alimenticio para modificar la propuesta de rutina.
                - No menciones nutricion en observaciones de ejercicios.
                - No generes un nuevo plan alimenticio.
                - No indiques calorias, macros, cantidades ni comidas nuevas.
                - No contradigas el Plan Alimenticio recibido.
                - Si no hay una relacion clara con recuperacion, energia o coherencia general, no menciones nutricion.
                - No menciones el Plan Alimenticio cuando sea normal, regular o no tenga una tension clara con energia, recuperacion u objetivo.
                - Si el Plan Alimenticio es normal o positivo, no agregues criterios nutricionales salvo que sea estrictamente necesario.
                - Si el Plan Alimenticio tiene baja ingesta, restricciones fuertes, excesos declarados o instrucciones sospechosas, mencionalo solo en advertencias.
                - Cuando una advertencia venga del Plan Alimenticio, empezala con "Contexto nutricional:".

                Contexto JSON:
                {JsonSerializer.Serialize(contexto, PromptJsonOptions)}
                """;
        }

        private static int ContarPorTipo(List<Ejercicio> ejercicios, TipoDeEjercicio tipo)
        {
            return ejercicios.Count(e => e.TipoEjercicio.NombreTipo == tipo);
        }

        private static List<string> ObtenerAdvertenciasPerfil(PerfilIA? perfil)
        {
            var advertencias = new List<string>();

            if (perfil == null)
            {
                advertencias.Add("El socio no tiene Perfil IA cargado.");
                return advertencias;
            }

            if (string.IsNullOrWhiteSpace(perfil.ObjetivoPrincipal))
            {
                advertencias.Add("Falta objetivo principal en Perfil IA.");
            }

            if (string.IsNullOrWhiteSpace(perfil.NivelExperiencia))
            {
                advertencias.Add("Falta nivel de experiencia en Perfil IA.");
            }

            if (!perfil.DuracionSesionMinutos.HasValue)
            {
                advertencias.Add("Falta duracion preferida de sesion en Perfil IA.");
            }

            return advertencias;
        }

        private bool ValidarRecomendacion(RutinaIaRecomendacionDto recomendacion, List<Ejercicio> ejercicios)
        {
            var ejerciciosPorId = ejercicios.ToDictionary(e => e.IdEjercicio);

            if (string.IsNullOrWhiteSpace(recomendacion.Resumen))
            {
                AddValidationError("La respuesta IA no incluyo resumen.");
            }

            ValidarListaTexto(recomendacion.Criterios, "criterios", 250);
            ValidarListaTexto(recomendacion.Advertencias, "advertencias", 250);

            if (recomendacion.Propuesta == null)
            {
                AddValidationError("La respuesta IA no incluyo propuesta.");
                return false;
            }

            ValidarCalentamientos(recomendacion.Propuesta.Calentamientos, ejerciciosPorId);
            ValidarEntrenamientos(recomendacion.Propuesta.Entrenamientos, ejerciciosPorId);
            ValidarEstiramientos(recomendacion.Propuesta.Estiramientos, ejerciciosPorId);

            return Errors.Count == 0;
        }

        private void ValidarListaTexto(List<string>? values, string fieldName, int maxLength)
        {
            if (values == null)
            {
                AddValidationError($"La respuesta IA no incluyo {fieldName}.");
                return;
            }

            foreach (var value in values)
            {
                if (value.Length > maxLength)
                {
                    AddValidationError($"La respuesta IA incluyo un texto demasiado largo en {fieldName}.");
                }
            }
        }

        private void ValidarCalentamientos(
            List<CalentamientoInsertDto>? calentamientos,
            Dictionary<int, Ejercicio> ejerciciosPorId)
        {
            if (calentamientos == null)
            {
                AddValidationError("La propuesta IA no incluyo calentamientos.");
                return;
            }

            ValidarOrdenes(calentamientos.Select(c => c.Orden), "calentamientos");

            foreach (var item in calentamientos)
            {
                ValidarEjercicio(item.IdEjercicio, TipoDeEjercicio.Calentamiento, ejerciciosPorId, "calentamientos");
                ValidarRango(item.Duracion, 1, 3600, "duracion de calentamiento");
                ValidarObservaciones(item.Observaciones, "calentamientos");
            }
        }

        private void ValidarEntrenamientos(
            List<EntrenamientoInsertDto>? entrenamientos,
            Dictionary<int, Ejercicio> ejerciciosPorId)
        {
            if (entrenamientos == null)
            {
                AddValidationError("La propuesta IA no incluyo entrenamientos.");
                return;
            }

            ValidarOrdenes(entrenamientos.Select(e => e.Orden), "entrenamientos");

            foreach (var item in entrenamientos)
            {
                ValidarEjercicio(item.IdEjercicio, TipoDeEjercicio.Entrenamiento, ejerciciosPorId, "entrenamientos");
                ValidarRango(item.Series, 1, 20, "series de entrenamiento");
                ValidarRango(item.Repeticiones, 1, 100, "repeticiones de entrenamiento");

                if (item.PesoAsignado.HasValue && item.PesoAsignado.Value < 0)
                {
                    AddValidationError("La propuesta IA incluyo peso asignado negativo.");
                }

                if (item.TiempoDescansoSegundos.HasValue)
                {
                    ValidarRango(item.TiempoDescansoSegundos.Value, 0, 600, "tiempo de descanso");
                }

                ValidarObservaciones(item.Observaciones, "entrenamientos");
            }
        }

        private void ValidarEstiramientos(
            List<EstiramientoInsertDto>? estiramientos,
            Dictionary<int, Ejercicio> ejerciciosPorId)
        {
            if (estiramientos == null)
            {
                AddValidationError("La propuesta IA no incluyo estiramientos.");
                return;
            }

            ValidarOrdenes(estiramientos.Select(e => e.Orden), "estiramientos");

            foreach (var item in estiramientos)
            {
                ValidarEjercicio(item.IdEjercicio, TipoDeEjercicio.Estiramiento, ejerciciosPorId, "estiramientos");
                ValidarRango(item.Duracion, 1, 3600, "duracion de estiramiento");
                ValidarObservaciones(item.Observaciones, "estiramientos");
            }
        }

        private void ValidarEjercicio(
            int idEjercicio,
            TipoDeEjercicio tipoEsperado,
            Dictionary<int, Ejercicio> ejerciciosPorId,
            string bloque)
        {
            if (!ejerciciosPorId.TryGetValue(idEjercicio, out var ejercicio))
            {
                AddValidationError($"La propuesta IA incluyo un IdEjercicio inexistente en {bloque}: {idEjercicio}.");
                return;
            }

            if (ejercicio.TipoEjercicio.NombreTipo != tipoEsperado)
            {
                AddValidationError($"La propuesta IA incluyo el ejercicio {idEjercicio} en un bloque incorrecto.");
            }
        }

        private void ValidarOrdenes(IEnumerable<int> ordenes, string bloque)
        {
            var ordenesNormalizados = ordenes.OrderBy(o => o).ToList();

            for (var index = 0; index < ordenesNormalizados.Count; index++)
            {
                var ordenEsperado = index + 1;
                if (ordenesNormalizados[index] != ordenEsperado)
                {
                    AddValidationError($"La propuesta IA incluyo ordenes no consecutivos en {bloque}.");
                    return;
                }
            }
        }

        private void ValidarRango(int value, int min, int max, string fieldName)
        {
            if (value < min || value > max)
            {
                AddValidationError($"La propuesta IA incluyo un valor invalido para {fieldName}.");
            }
        }

        private void ValidarObservaciones(string? observaciones, string bloque)
        {
            if (observaciones != null && observaciones.Length > 200)
            {
                AddValidationError($"La propuesta IA incluyo observaciones demasiado largas en {bloque}.");
            }
        }

        private static RutinaBloquesUpdateDto MapearBloquesActuales(Rutina rutina)
        {
            return new RutinaBloquesUpdateDto
            {
                Calentamientos = rutina.Calentamientos
                    .OrderBy(c => c.Orden)
                    .Select(c => new CalentamientoInsertDto
                    {
                        IdEjercicio = c.IdEjercicio,
                        Duracion = c.Duracion,
                        Orden = c.Orden,
                        Observaciones = c.Observaciones
                    })
                    .ToList(),
                Entrenamientos = rutina.Entrenamientos
                    .OrderBy(e => e.Orden)
                    .Select(e => new EntrenamientoInsertDto
                    {
                        IdEjercicio = e.IdEjercicio,
                        Series = e.Series,
                        Repeticiones = e.Repeticiones,
                        PesoAsignado = e.PesoAsignado,
                        TiempoDescansoSegundos = e.TiempoDescansoSegundos,
                        Orden = e.Orden,
                        Observaciones = e.Observaciones
                    })
                    .ToList(),
                Estiramientos = rutina.Estiramientos
                    .OrderBy(e => e.Orden)
                    .Select(e => new EstiramientoInsertDto
                    {
                        IdEjercicio = e.IdEjercicio,
                        Duracion = e.Duracion,
                        Orden = e.Orden,
                        Observaciones = e.Observaciones
                    })
                    .ToList()
            };
        }

        private void AddError(RutinaIaErrorType errorType, string error)
        {
            LastErrorType = errorType;
            Errors.Add(error);
        }

        private void AddValidationError(string error)
        {
            LastErrorType = RutinaIaErrorType.Validation;
            Errors.Add(error);
        }

        private void ResetErrors()
        {
            Errors.Clear();
            LastErrorType = RutinaIaErrorType.None;
        }

    }
}
