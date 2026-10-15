using MindFit_Intelligence_Backend.DTOs.Formularios;
using MindFit_Intelligence_Backend.Repository.Interfaces;
using MindFit_Intelligence_Backend.Services.Interfaces;

namespace MindFit_Intelligence_Backend.Services
{
    public class FormularioService : IFormularioService
    {
        private readonly IFormularioRepository _formularioRepository;

        public FormularioService(IFormularioRepository formularioRepository)
        {
            _formularioRepository = formularioRepository;
        }

        public async Task<IEnumerable<FormularioDto>> Get()
        {
            var formularios = await _formularioRepository.GetConPermisos();

            return formularios
                .Select(f => new FormularioDto
                {
                    IdFormulario = f.IdFormulario,
                    NombreFormulario = f.NombreFormulario,
                    Permisos = f.FormularioPermisos
                        .Select(fp => fp.Permiso.Codigo)
                        .Distinct()
                        .ToList()
                })
                .ToList();
        }
    }
}
