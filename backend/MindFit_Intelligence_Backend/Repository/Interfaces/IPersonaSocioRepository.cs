using MindFit_Intelligence_Backend.Models;

namespace MindFit_Intelligence_Backend.Repository.Interfaces
{
    public interface IPersonaSocioRepository
    {
        public Task<PersonaSocio?> GetById(int id);
        public Task<PersonaSocio?> GetByEmail(string email);
        public Task<List<PersonaSocio>> GetSociosSuspendidos();
    }
}
