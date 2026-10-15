using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using MindFit_Intelligence_Backend.DTOs.IA;
using MindFit_Intelligence_Backend.Services.Interfaces;

namespace MindFit_Intelligence_Backend.Services
{
    public class OpenAiRutinaClient : IOpenAiRutinaClient
    {
        private const string DefaultModel = "gpt-5.4-mini";
        private const string DefaultBaseUrl = "https://api.openai.com/v1";
        private const int DefaultMaxOutputTokens = 1200;
        private const int DefaultTimeoutSeconds = 30;

        private static readonly JsonSerializerOptions JsonOptions = new()
        {
            PropertyNameCaseInsensitive = true
        };

        private readonly HttpClient _httpClient;
        private readonly IConfiguration _configuration;

        public OpenAiRutinaClient(HttpClient httpClient, IConfiguration configuration)
        {
            _httpClient = httpClient;
            _configuration = configuration;
        }

        public async Task<RutinaIaRecomendacionDto> GenerarRecomendacionAsync(
            string systemPrompt,
            string userPrompt)
        {
            var apiKey = _configuration["OpenAI:ApiKey"];
            if (string.IsNullOrWhiteSpace(apiKey))
            {
                throw new OpenAiRutinaClientException("OpenAI:ApiKey no esta configurada.");
            }

            ConfigurarHttpClient(apiKey);

            var requestBody = new
            {
                model = ObtenerConfiguracion("OpenAI:Model", DefaultModel),
                input = new object[]
                {
                    new { role = "system", content = systemPrompt },
                    new { role = "user", content = userPrompt }
                },
                text = new
                {
                    format = new
                    {
                        type = "json_schema",
                        name = "rutina_ia_recomendacion",
                        strict = true,
                        schema = CrearSchemaRespuesta()
                    }
                },
                max_output_tokens = ObtenerEnteroConfiguracion("OpenAI:MaxOutputTokens", DefaultMaxOutputTokens),
                store = false
            };

            using var content = new StringContent(
                JsonSerializer.Serialize(requestBody),
                Encoding.UTF8,
                "application/json");

            using var response = await _httpClient.PostAsync("responses", content);
            var responseJson = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                throw new OpenAiRutinaClientException($"OpenAI devolvio HTTP {(int)response.StatusCode}: {ExtraerMensajeError(responseJson)}");
            }

            var outputText = ExtraerOutputText(responseJson);
            var recomendacion = JsonSerializer.Deserialize<RutinaIaRecomendacionDto>(outputText, JsonOptions);

            return recomendacion ?? throw new OpenAiRutinaClientException("OpenAI devolvio una respuesta vacia o incompatible.");
        }

        private void ConfigurarHttpClient(string apiKey)
        {
            var baseUrl = ObtenerConfiguracion("OpenAI:BaseUrl", DefaultBaseUrl).TrimEnd('/') + "/";
            _httpClient.BaseAddress = new Uri(baseUrl);
            _httpClient.Timeout = TimeSpan.FromSeconds(
                Math.Max(1, ObtenerEnteroConfiguracion("OpenAI:TimeoutSeconds", DefaultTimeoutSeconds)));
            _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);
        }

        private string ObtenerConfiguracion(string key, string defaultValue)
        {
            var value = _configuration[key];
            return string.IsNullOrWhiteSpace(value) ? defaultValue : value;
        }

        private int ObtenerEnteroConfiguracion(string key, int defaultValue)
        {
            var value = _configuration[key];
            return int.TryParse(value, out var parsedValue) && parsedValue > 0 ? parsedValue : defaultValue;
        }

        private static object CrearSchemaRespuesta()
        {
            var observacionesSchema = new { type = new[] { "string", "null" }, maxLength = 200 };

            return new
            {
                type = "object",
                additionalProperties = false,
                required = new[] { "resumen", "criterios", "advertencias", "propuesta" },
                properties = new Dictionary<string, object>
                {
                    ["resumen"] = new { type = "string", maxLength = 700 },
                    ["criterios"] = new
                    {
                        type = "array",
                        maxItems = 8,
                        items = new { type = "string", maxLength = 250 }
                    },
                    ["advertencias"] = new
                    {
                        type = "array",
                        maxItems = 8,
                        items = new { type = "string", maxLength = 250 }
                    },
                    ["propuesta"] = new
                    {
                        type = "object",
                        additionalProperties = false,
                        required = new[] { "calentamientos", "entrenamientos", "estiramientos" },
                        properties = new Dictionary<string, object>
                        {
                            ["calentamientos"] = CrearArrayBloque(CrearCalentamientoSchema(observacionesSchema)),
                            ["entrenamientos"] = CrearArrayBloque(CrearEntrenamientoSchema(observacionesSchema)),
                            ["estiramientos"] = CrearArrayBloque(CrearEstiramientoSchema(observacionesSchema))
                        }
                    }
                }
            };
        }

        private static object CrearArrayBloque(object itemSchema)
        {
            return new
            {
                type = "array",
                maxItems = 12,
                items = itemSchema
            };
        }

        private static object CrearCalentamientoSchema(object observacionesSchema)
        {
            return new
            {
                type = "object",
                additionalProperties = false,
                required = new[] { "idEjercicio", "duracion", "orden", "observaciones" },
                properties = new Dictionary<string, object>
                {
                    ["idEjercicio"] = new { type = "integer", minimum = 1 },
                    ["duracion"] = new { type = "integer", minimum = 1, maximum = 3600 },
                    ["orden"] = new { type = "integer", minimum = 1 },
                    ["observaciones"] = observacionesSchema
                }
            };
        }

        private static object CrearEntrenamientoSchema(object observacionesSchema)
        {
            return new
            {
                type = "object",
                additionalProperties = false,
                required = new[] { "idEjercicio", "series", "repeticiones", "pesoAsignado", "tiempoDescansoSegundos", "orden", "observaciones" },
                properties = new Dictionary<string, object>
                {
                    ["idEjercicio"] = new { type = "integer", minimum = 1 },
                    ["series"] = new { type = "integer", minimum = 1, maximum = 20 },
                    ["repeticiones"] = new { type = "integer", minimum = 1, maximum = 100 },
                    ["pesoAsignado"] = new { type = new[] { "number", "null" }, minimum = 0 },
                    ["tiempoDescansoSegundos"] = new { type = new[] { "integer", "null" }, minimum = 0, maximum = 600 },
                    ["orden"] = new { type = "integer", minimum = 1 },
                    ["observaciones"] = observacionesSchema
                }
            };
        }

        private static object CrearEstiramientoSchema(object observacionesSchema)
        {
            return new
            {
                type = "object",
                additionalProperties = false,
                required = new[] { "idEjercicio", "duracion", "orden", "observaciones" },
                properties = new Dictionary<string, object>
                {
                    ["idEjercicio"] = new { type = "integer", minimum = 1 },
                    ["duracion"] = new { type = "integer", minimum = 1, maximum = 3600 },
                    ["orden"] = new { type = "integer", minimum = 1 },
                    ["observaciones"] = observacionesSchema
                }
            };
        }

        private static string ExtraerOutputText(string responseJson)
        {
            using var document = JsonDocument.Parse(responseJson);
            var root = document.RootElement;

            if (root.TryGetProperty("error", out var errorElement)
                && errorElement.ValueKind != JsonValueKind.Null)
            {
                throw new OpenAiRutinaClientException(ExtraerMensajeError(responseJson));
            }

            if (root.TryGetProperty("incomplete_details", out var incompleteDetails)
                && incompleteDetails.ValueKind != JsonValueKind.Null)
            {
                throw new OpenAiRutinaClientException("OpenAI no completo la respuesta dentro de los limites configurados.");
            }

            if (root.TryGetProperty("output_text", out var outputTextElement)
                && outputTextElement.ValueKind == JsonValueKind.String)
            {
                return outputTextElement.GetString() ?? string.Empty;
            }

            if (root.TryGetProperty("output", out var outputElement)
                && outputElement.ValueKind == JsonValueKind.Array)
            {
                var outputBuilder = new StringBuilder();

                foreach (var outputItem in outputElement.EnumerateArray())
                {
                    if (!outputItem.TryGetProperty("content", out var contentElement)
                        || contentElement.ValueKind != JsonValueKind.Array)
                    {
                        continue;
                    }

                    foreach (var contentItem in contentElement.EnumerateArray())
                    {
                        if (contentItem.TryGetProperty("refusal", out var refusal)
                            && refusal.ValueKind == JsonValueKind.String)
                        {
                            throw new OpenAiRutinaClientException("OpenAI rechazo generar la recomendacion solicitada.");
                        }

                        if (contentItem.TryGetProperty("text", out var textElement)
                            && textElement.ValueKind == JsonValueKind.String)
                        {
                            outputBuilder.Append(textElement.GetString());
                        }
                    }
                }

                if (outputBuilder.Length > 0)
                {
                    return outputBuilder.ToString();
                }
            }

            throw new OpenAiRutinaClientException("OpenAI no devolvio texto estructurado.");
        }

        private static string ExtraerMensajeError(string responseJson)
        {
            try
            {
                using var document = JsonDocument.Parse(responseJson);
                if (document.RootElement.TryGetProperty("error", out var error)
                    && error.TryGetProperty("message", out var message)
                    && message.ValueKind == JsonValueKind.String)
                {
                    return message.GetString() ?? "Error desconocido.";
                }
            }
            catch (JsonException)
            {
                return "Error desconocido.";
            }

            return "Error desconocido.";
        }
    }
}
