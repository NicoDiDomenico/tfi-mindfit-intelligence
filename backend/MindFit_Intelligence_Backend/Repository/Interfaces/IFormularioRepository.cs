using MindFit_Intelligence_Backend.Models;

namespace MindFit_Intelligence_Backend.Repository.Interfaces
{
    public interface IFormularioRepository
    {
        Task<IEnumerable<Formulario>> GetConPermisos();
    }
}
