using MindFit_Intelligence_Backend.DTOs;

namespace MindFit_Intelligence_Backend.Services.Interfaces
{
    public interface IPersonaService<T>
    {
        public Task<IEnumerable<T>> Get();
        public Task<T?> GetById(int id);
    }
}
