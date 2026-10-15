using AutoMapper;
using MindFit_Intelligence_Backend.DTOs.Permisos;
using MindFit_Intelligence_Backend.Models;
using MindFit_Intelligence_Backend.Repository.Interfaces;
using MindFit_Intelligence_Backend.Services.Interfaces;

namespace MindFit_Intelligence_Backend.Services
{
    public class PermisoService : IPermisoService
    {
        private IPermisoRepository _permisoRepository;
        private readonly IMapper _mapper;
        public PermisoService(IPermisoRepository permisoRepository, IMapper mapper)
        {
            _permisoRepository = permisoRepository;
            _mapper = mapper;
        }
        public async Task<IEnumerable<PermisoDto>> Get()
        {
            var permisos = await _permisoRepository.Get();

            var permisosDtos = _mapper.Map<IEnumerable<PermisoDto>>(permisos);

            return permisosDtos;
        }
    }
}
