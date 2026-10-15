using Swashbuckle.AspNetCore.SwaggerGen;
using Microsoft.OpenApi;
using System.Collections.Generic;

namespace MindFit_Intelligence_Backend.Swagger
{
    public class TenantHeaderOperationFilter : IOperationFilter
    {
        public void Apply(OpenApiOperation operation, OperationFilterContext context)
        {
            if (operation.Parameters == null)
            {
                // Usamos la "I" adelante como pide tu versión
                operation.Parameters = new List<IOpenApiParameter>();
            }

            // Añade el header X-Gym-Id (no obligatorio) con descripción clara
            operation.Parameters.Add(new OpenApiParameter
            {
                Name = "X-Gym-Id",
                In = ParameterLocation.Header,
                Description = "Id del gimnasio (tenant). OBLIGATORIO para endpoints públicos (login/refresh/forgot-password). OPCIONAL para endpoints autenticados (si viaja en JWT, se usa automáticamente).",
                Required = false,
                // Usamos el Enum oficial como pide tu versión
                Schema = new OpenApiSchema { Type = JsonSchemaType.String }
            });
        }
    }
}