using MindFit_Intelligence_Backend.DTOs.Grupos;
using MindFit_Intelligence_Backend.DTOs.Usuarios;

namespace MindFit_Intelligence_Backend.Services.Interfaces
{
    public interface IGrupoService : ICommonService<GrupoDto, GrupoInsertDto, GrupoUpdateDto>
    {
        Task<IEnumerable<GrupoDto>> GetAllSinPermisos();

        List<string> Errors { get; }
        bool ValidateDelete(int id);
        Task<IEnumerable<GrupoAuthDto>> GetAuth();
    }
}
