using AutoMapper;
using MindFit_Intelligence_Backend.DTOs.GrupoMuscular;
using MindFit_Intelligence_Backend.Repository.Interfaces;
using MindFit_Intelligence_Backend.Services.Interfaces;

namespace MindFit_Intelligence_Backend.Services
{
    public class GrupoMuscularService : IGrupoMuscularService
    {
        private readonly IGrupoMuscularRepository _repository;
        private readonly IMapper _mapper;

        public List<string> Errors { get; } = new List<string>();

        public GrupoMuscularService(IGrupoMuscularRepository repository, IMapper mapper)
        {
            _repository = repository;
            _mapper = mapper;
        }

        public async Task<IEnumerable<GrupoMuscularDto>> GetAsync()
        {
            var entities = await _repository.Get();
            return _mapper.Map<IEnumerable<GrupoMuscularDto>>(entities);
        }

        public async Task<GrupoMuscularDto?> GetByIdAsync(int id)
        {
            var entity = await _repository.GetById(id);

            if (entity == null)
            {
                Errors.Add("Grupo Muscular no encontrado.");
                return null;
            }

            return _mapper.Map<GrupoMuscularDto>(entity);
        }
    }
}
