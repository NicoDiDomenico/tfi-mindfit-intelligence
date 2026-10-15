using MindFit_Intelligence_Backend.DTOs.Permisos;

namespace MindFit_Intelligence_Backend.Services.Interfaces
{
    public interface IPermisoService
    {
        public Task<IEnumerable<PermisoDto>> Get();
    }
}
