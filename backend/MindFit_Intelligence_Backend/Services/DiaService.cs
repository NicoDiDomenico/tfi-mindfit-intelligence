using AutoMapper;
using MindFit_Intelligence_Backend.DTOs.Dia;
using MindFit_Intelligence_Backend.Models;
using MindFit_Intelligence_Backend.Repository.Interfaces;
using MindFit_Intelligence_Backend.Services.Interfaces;

namespace MindFit_Intelligence_Backend.Services
{
    public class DiaService : IDiaService
    {
        private readonly IDiaRepository _diaRepository;
        private readonly IMapper _mapper;

        public DiaService(IDiaRepository diaRepository, IMapper mapper)
        {
            _diaRepository = diaRepository;
            _mapper = mapper;
        }

        public async Task<IEnumerable<DiaDto>> GetDias()
        {
            IEnumerable<Dia> dias = await _diaRepository.GetAll();
            return _mapper.Map<IEnumerable<DiaDto>>(dias);
        }
    }
}
