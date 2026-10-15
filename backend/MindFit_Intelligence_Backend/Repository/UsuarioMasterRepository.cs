using MindFit_Intelligence_Backend.Models.Master;
using MindFit_Intelligence_Backend.Repository.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace MindFit_Intelligence_Backend.Repository
{
    public class UsuarioMasterRepository : IUsuarioMasterRepository
    {
        private readonly MindFitMasterContext _masterContext;

        public UsuarioMasterRepository(MindFitMasterContext masterContext)
        {
            _masterContext = masterContext;
        }

        public async Task<bool> ExistsByUsernameAsync(string username)
        {
            return await _masterContext.UsuarioMasters
                .AsNoTracking()
                .AnyAsync(u => u.Username == username);
        }

        public Task Add(UsuarioMaster usuario)
        {
            _masterContext.UsuarioMasters.Add(usuario);
            return Task.CompletedTask;
        }

        public async Task Save()
        {
            await _masterContext.SaveChangesAsync();
        }
    }
}
