using MindFit_Intelligence_Backend.DTOs.Formularios;

namespace MindFit_Intelligence_Backend.Services.Interfaces
{
    public interface IFormularioService
    {
        Task<IEnumerable<FormularioDto>> Get();
    }
}
