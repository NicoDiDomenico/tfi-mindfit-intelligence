using AutoMapper;
using MindFit_Intelligence_Backend.DTOs.Grupos;
using MindFit_Intelligence_Backend.Models;
using MindFit_Intelligence_Backend.Repository.Interfaces;
using MindFit_Intelligence_Backend.Services.Interfaces;

namespace MindFit_Intelligence_Backend.Services
{
    public class GrupoService : IGrupoService
    {
        private IGrupoRepository _grupoRepository;
        private IMapper _mapper;
        public List<string> Errors { get; }

        public GrupoService(IGrupoRepository grupoRepository, IMapper mapper)
        {
            _grupoRepository = grupoRepository;
            _mapper = mapper;
            Errors  = new List<string>();
        }

        public async Task<IEnumerable<GrupoDto>> Get()
        {
            var grupos = await _grupoRepository.Get();

            return grupos == null ? new List<GrupoDto>() : _mapper.Map<IEnumerable<GrupoDto>>(grupos);
        }

        public async Task<IEnumerable<GrupoAuthDto>> GetAuth()
        {
            var grupos = await _grupoRepository.Get();

            return grupos == null ? new List<GrupoAuthDto>() : _mapper.Map<IEnumerable<GrupoAuthDto>>(grupos);
        }

        public async Task<IEnumerable<GrupoDto>> GetAllSinPermisos()
        {
            var grupos = await _grupoRepository.GetAllSinPermisos();

            return grupos.Select(g => new GrupoDto
            {
                IdGrupo = g.IdGrupo,
                Nombre = g.Nombre,
                Descripcion = g.Descripcion ?? string.Empty
            });
        }

        public async Task<GrupoDto?> GetById(int id)
        {
            var grupo = await _grupoRepository.GetById(id);

            return grupo == null ? null : _mapper.Map<GrupoDto>(grupo);
        }

        public async Task<GrupoDto> Add(GrupoInsertDto grupoInsertDto)
        {
            var grupo = _mapper.Map<Grupo>(grupoInsertDto);

            await _grupoRepository.Add(grupo);
            await _grupoRepository.Save();

            var grupoCompleto = await _grupoRepository.GetById(grupo.IdGrupo);
            /* No me convence esto, para mí esto no debería pasaar. Para evitar esta excepcion tedria que armar manualmente el dto
             * a partir del grupo que ya tengo, no volver a consultar a la base de datos. Pero bueno, lo dejo así por ahora.
            if (grupoCompleto == null)
                throw new Exception("No se pudo recuperar el grupo creado.");
            */
            return _mapper.Map<GrupoDto>(grupoCompleto);
        }

        public async Task<GrupoDto?> Update(int id, GrupoUpdateDto grupoUpdateDto)
        {
            var grupo = await _grupoRepository.GetById(id);

            if (grupo == null)
                return null;

            _grupoRepository.RemoveGrupoPermisos(grupo.GrupoPermisos);

            _mapper.Map(grupoUpdateDto, grupo);
            await _grupoRepository.Save();

            var grupoDto = _mapper.Map<GrupoDto>(grupo);

            return grupoDto == null ? null : grupoDto;
        }

        public async Task<GrupoDto?> Delete(int id)
        {
            var grupo = await _grupoRepository.GetById(id);
            // GetById debe traer Include(g => g.GrupoPermisos)

            if (grupo == null)
                return null;

            var grupoDto = _mapper.Map<GrupoDto>(grupo);

            _grupoRepository.Delete(grupo); // Elimina el grupo, y como EF tiene Cascade Delete se borrará GrupoPermisos

            await _grupoRepository.Save();

            return grupoDto;
        }

        public bool ValidateDelete(int id)
        {
            Errors.Clear();

            if (_grupoRepository.Search(gu => gu.IdGrupo == id).Any())
            {
                Errors.Add("No se puede eliminar el grupo porque está asignado a usuarios.");
                return false;
            }
            return true;
        }
    }
}
