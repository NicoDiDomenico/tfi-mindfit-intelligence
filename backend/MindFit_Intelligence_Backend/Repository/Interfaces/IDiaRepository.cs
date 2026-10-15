using MindFit_Intelligence_Backend.Models;

namespace MindFit_Intelligence_Backend.Repository.Interfaces
{
    public interface IDiaRepository
    {
        public Task<IEnumerable<Dia>> GetAll();
    }
}
