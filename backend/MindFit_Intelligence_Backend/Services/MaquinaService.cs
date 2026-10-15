using AutoMapper;
using MindFit_Intelligence_Backend.DTOs.Maquinas;
using MindFit_Intelligence_Backend.Models;
using MindFit_Intelligence_Backend.Repository.Interfaces;
using MindFit_Intelligence_Backend.Services.Interfaces;

namespace MindFit_Intelligence_Backend.Services
{
    public class MaquinaService : IMaquinaService
    {
        private readonly IMaquinaRepository _maquinaRepository;
        private readonly IMapper _mapper;

        public List<string> Errors { get; } = new List<string>();

        public MaquinaService(IMaquinaRepository maquinaRepository, IMapper mapper)
        {
            _maquinaRepository = maquinaRepository;
            _mapper = mapper;
        }

        public bool Validate(MaquinaInsertDto dto)
        {
            Errors.Clear();
            if (string.IsNullOrWhiteSpace(dto.NombreMaquina))
                Errors.Add("El nombre de la máquina es obligatorio.");
            return Errors.Count == 0;
        }

        public bool Validate(MaquinaUpdateDto dto)
        {
            Errors.Clear();
            if (string.IsNullOrWhiteSpace(dto.NombreMaquina))
                Errors.Add("El nombre de la máquina es obligatorio.");
            return Errors.Count == 0;
        }

        public async Task<IEnumerable<MaquinaDto>> GetMaquinasAsync()
        {
            var maquinas = await _maquinaRepository.Get();
            return _mapper.Map<IEnumerable<MaquinaDto>>(maquinas);
        }

        public async Task<MaquinaDto?> GetMaquinaByIdAsync(int id)
        {
            Errors.Clear();
            var maquina = await _maquinaRepository.GetById(id);
            if (maquina == null)
            {
                Errors.Add("La máquina no existe.");
                return null;
            }

            return _mapper.Map<MaquinaDto>(maquina);
        }

        public async Task<MaquinaDto?> CreateMaquinaAsync(MaquinaInsertDto insertDto)
        {
            var maquina = _mapper.Map<Maquina>(insertDto);

            await _maquinaRepository.Add(maquina);
            await _maquinaRepository.Save();

            return _mapper.Map<MaquinaDto>(maquina);
        }

        public async Task<MaquinaDto?> UpdateMaquinaAsync(int id, MaquinaUpdateDto updateDto)
        {
            Errors.Clear();
            var maquina = await _maquinaRepository.GetById(id);
            if (maquina == null)
            {
                Errors.Add("La máquina no existe.");
                return null;
            }

            _mapper.Map(updateDto, maquina);

            _maquinaRepository.Update(maquina);
            await _maquinaRepository.Save();

            return _mapper.Map<MaquinaDto>(maquina);
        }

        public async Task<MaquinaDto?> DeleteMaquinaAsync(int id)
        {
            Errors.Clear();
            var maquina = await _maquinaRepository.GetById(id);
            if (maquina == null)
            {
                Errors.Add("La máquina no existe.");
                return null;
            }

            var deletedMaquinaDto = _mapper.Map<MaquinaDto>(maquina);

            _maquinaRepository.Delete(maquina);
            await _maquinaRepository.Save();

            return deletedMaquinaDto;
        }
    }
}