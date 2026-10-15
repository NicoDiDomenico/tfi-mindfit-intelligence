using AutoMapper;
using MindFit_Intelligence_Backend.DTOs.Equipamientos;
using MindFit_Intelligence_Backend.Models;
using MindFit_Intelligence_Backend.Repository.Interfaces;
using MindFit_Intelligence_Backend.Services.Interfaces;

namespace MindFit_Intelligence_Backend.Services
{
    public class EquipamientoService : IEquipamientoService
    {
        private readonly IEquipamientoRepository _equipamientoRepository;
        private readonly IMapper _mapper;

        public List<string> Errors { get; } = new List<string>();

        public EquipamientoService(IEquipamientoRepository equipamientoRepository, IMapper mapper)
        {
            _equipamientoRepository = equipamientoRepository;
            _mapper = mapper;
        }

        public bool Validate(EquipamientoInsertDto dto)
        {
            Errors.Clear();
            if (string.IsNullOrWhiteSpace(dto.NombreEquipo))
                Errors.Add("El nombre del equipamiento es obligatorio.");
            return Errors.Count == 0;
        }

        public bool Validate(EquipamientoUpdateDto dto)
        {
            Errors.Clear();
            if (string.IsNullOrWhiteSpace(dto.NombreEquipo))
                Errors.Add("El nombre del equipamiento es obligatorio.");
            return Errors.Count == 0;
        }

        public async Task<IEnumerable<EquipamientoDto>> GetEquipamientosAsync()
        {
            var equipamientos = await _equipamientoRepository.Get();
            return _mapper.Map<IEnumerable<EquipamientoDto>>(equipamientos);
        }

        public async Task<EquipamientoDto?> GetEquipamientoByIdAsync(int id)
        {
            Errors.Clear();
            var equipamiento = await _equipamientoRepository.GetById(id);
            if (equipamiento == null)
            {
                Errors.Add("El equipamiento no existe.");
                return null;
            }

            return _mapper.Map<EquipamientoDto>(equipamiento);
        }

        public async Task<EquipamientoDto?> CreateEquipamientoAsync(EquipamientoInsertDto insertDto)
        {
            var equipamiento = _mapper.Map<Equipamiento>(insertDto);

            await _equipamientoRepository.Add(equipamiento);
            await _equipamientoRepository.Save();

            return _mapper.Map<EquipamientoDto>(equipamiento);
        }

        public async Task<EquipamientoDto?> UpdateEquipamientoAsync(int id, EquipamientoUpdateDto updateDto)
        {
            Errors.Clear();
            var equipamiento = await _equipamientoRepository.GetById(id);
            if (equipamiento == null)
            {
                Errors.Add("El equipamiento no existe.");
                return null;
            }

            _mapper.Map(updateDto, equipamiento);

            _equipamientoRepository.Update(equipamiento);
            await _equipamientoRepository.Save();

            return _mapper.Map<EquipamientoDto>(equipamiento);
        }

        public async Task<EquipamientoDto?> DeleteEquipamientoAsync(int id)
        {
            Errors.Clear();
            var equipamiento = await _equipamientoRepository.GetById(id);
            if (equipamiento == null)
            {
                Errors.Add("El equipamiento no existe.");
                return null;
            }

            var deletedEquipamientoDto = _mapper.Map<EquipamientoDto>(equipamiento);

            _equipamientoRepository.Delete(equipamiento);
            await _equipamientoRepository.Save();

            return deletedEquipamientoDto;
        }
    }
}