using MindFit_Intelligence_Backend.DTOs.IA;

namespace MindFit_Intelligence_Backend.Services.Interfaces
{
    public interface IOpenAiRutinaClient
    {
        Task<RutinaIaRecomendacionDto> GenerarRecomendacionAsync(
            string systemPrompt,
            string userPrompt);
    }
}
