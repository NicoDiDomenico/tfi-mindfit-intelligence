using MindFit_Intelligence_Backend.DTOs.Usuarios;
using MindFit_Intelligence_Backend.Models;

namespace MindFit_Intelligence_Backend.Services.Interfaces
{
    public interface IUsuarioService
    {
        Task<Usuario?> GetById(int id);
        Task<List<UsuarioGridDto>> GetUsuariosGrid();
        Task<List<SocioGridDto>> GetUsuariosSociosGrid();
        Task<List<ResponsableGridDto>> GetUsuariosResponsablesGrid();
        Task<UsuarioDto?> GetUsuarioById(int id);
        Task<UsuarioDto?> Add(UsuarioInsertDto typeInsertDto);
        Task<UsuarioDto?> Update(int id, UsuarioUpdateDto typeUpdateDto);
        Task<UsuarioDto?> Delete(int id);
        Task<UsuarioDto?> AutoSoftDeleteSocio(int id);
        Task<ProcesarEliminacionesDto> ProcesarEliminacionesAutomaticas();
        Task<UsuarioDto?> SoftDeleteSocio(int id);
        Task<bool> ValidateDelete(int id);
        Task<bool> UsuarioTienePermiso(int idUsuario, string nombrePermiso);
        List<string> Errors { get; }
        bool Validate(UsuarioInsertDto dto);
        bool Validate(UsuarioUpdateDto dto);
        Task<bool> ValidateEmailAsync(UsuarioInsertDto dto);
        Task<bool> ValidateEmailAsync(int idUsuario, UsuarioUpdateDto dto);
        Task<bool> ValidateRecover(int idUsuario);
        Task<UsuarioDto?> RecoverSoftDeletedSocio(int idUsuario);
    }
}
