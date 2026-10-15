using MindFit_Intelligence_Backend.Models;
using System.Linq.Expressions;

namespace MindFit_Intelligence_Backend.Repository.Interfaces
{
    public interface IGrupoRepository : ICommonRepository<Grupo>
    {
        public Task<IEnumerable<Grupo>> GetAllSinPermisos();

        public void RemoveGrupoPermisos(IEnumerable<GrupoPermiso> items);

        public IEnumerable<UsuarioGrupo> Search(Expression<Func<UsuarioGrupo, bool>> filter);
    }
}
