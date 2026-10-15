using AutoMapper;
using MindFit_Intelligence_Backend.DTOs.TipoEjercicio;
using MindFit_Intelligence_Backend.Repository.Interfaces;
using MindFit_Intelligence_Backend.Services.Interfaces;

namespace MindFit_Intelligence_Backend.Services
{
    public class TipoEjercicioService : ITipoEjercicioService
    {
        private readonly ITipoEjercicioRepository _repository;
        private readonly IMapper _mapper;

        public List<string> Errors { get; } = new List<string>();

        public TipoEjercicioService(ITipoEjercicioRepository repository, IMapper mapper)
        {
            _repository = repository;
            _mapper = mapper;
        }

        public async Task<IEnumerable<TipoEjercicioDto>> GetAsync()
        {
            var entities = await _repository.Get();
            return _mapper.Map<IEnumerable<TipoEjercicioDto>>(entities);
        }

        public async Task<TipoEjercicioDto?> GetByIdAsync(int id)
        {
            var entity = await _repository.GetById(id);

            if (entity == null)
            {
                Errors.Add("Tipo de Ejercicio no encontrado.");
                return null;
            }

            return _mapper.Map<TipoEjercicioDto>(entity);
        }
    }
}
