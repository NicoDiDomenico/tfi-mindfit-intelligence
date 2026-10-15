using AutoMapper;
using Microsoft.EntityFrameworkCore;
using MindFit_Intelligence_Backend.DTOs.Ejercicios;
using MindFit_Intelligence_Backend.Models;
using MindFit_Intelligence_Backend.Repository.Interfaces;
using MindFit_Intelligence_Backend.Services.Interfaces;

namespace MindFit_Intelligence_Backend.Services
{
    public class EjercicioService : IEjercicioService
    {
        private readonly IEjercicioRepository _ejercicioRepository;
        private readonly IMapper _mapper;
        private readonly MindFitIntelligenceContext _context;

        public List<string> Errors { get; } = new List<string>();

        public EjercicioService(
            IEjercicioRepository ejercicioRepository,
            IMapper mapper,
            MindFitIntelligenceContext context)
        {
            _ejercicioRepository = ejercicioRepository;
            _mapper = mapper;
            _context = context;
        }

        public async Task<bool> ValidateAsync(EjercicioInsertDto dto)
        {
            Errors.Clear();
            var grupoExists = await _context.GruposMusculares.AnyAsync(g => g.IdGrupoMuscular == dto.IdGrupoMuscular);
            if (!grupoExists) Errors.Add("El Grupo Muscular especificado no existe.");

            var tipoExists = await _context.TiposEjercicios.AnyAsync(t => t.IdTipoEjercicio == dto.IdTipoEjercicio);
            if (!tipoExists) Errors.Add("El Tipo de Ejercicio especificado no existe.");

            if (dto.IdMaquina.HasValue)
            {
                var maquinaExists = await _context.Maquinas.AnyAsync(m => m.IdMaquina == dto.IdMaquina.Value);
                if (!maquinaExists) Errors.Add("La Máquina especificada no existe.");
            }

            if (dto.IdEquipamiento.HasValue)
            {
                var equipExists = await _context.Equipamientos.AnyAsync(e => e.IdEquipamiento == dto.IdEquipamiento.Value);
                if (!equipExists) Errors.Add("El Equipamiento especificado no existe.");
            }

            return Errors.Count == 0;
        }

        public async Task<bool> ValidateAsync(EjercicioUpdateDto dto)
        {
            Errors.Clear();
            var grupoExists = await _context.GruposMusculares.AnyAsync(g => g.IdGrupoMuscular == dto.IdGrupoMuscular);
            if (!grupoExists) Errors.Add("El Grupo Muscular especificado no existe.");

            var tipoExists = await _context.TiposEjercicios.AnyAsync(t => t.IdTipoEjercicio == dto.IdTipoEjercicio);
            if (!tipoExists) Errors.Add("El Tipo de Ejercicio especificado no existe.");

            if (dto.IdMaquina.HasValue)
            {
                var maquinaExists = await _context.Maquinas.AnyAsync(m => m.IdMaquina == dto.IdMaquina.Value);
                if (!maquinaExists) Errors.Add("La Máquina especificada no existe.");
            }

            if (dto.IdEquipamiento.HasValue)
            {
                var equipExists = await _context.Equipamientos.AnyAsync(e => e.IdEquipamiento == dto.IdEquipamiento.Value);
                if (!equipExists) Errors.Add("El Equipamiento especificado no existe.");
            }

            return Errors.Count == 0;
        }

        public async Task<IEnumerable<EjercicioDto>> GetEjerciciosAsync(int? idGrupoMuscular)
        {
            IEnumerable<Ejercicio> ejercicios;
            if (idGrupoMuscular.HasValue)
            {
                ejercicios = await _ejercicioRepository.GetByGrupoMuscularId(idGrupoMuscular.Value);
            }
            else
            {
                ejercicios = await _ejercicioRepository.Get();
            }

            return _mapper.Map<IEnumerable<EjercicioDto>>(ejercicios);
        }

        public async Task<EjercicioDto?> GetEjercicioByIdAsync(int id)
        {
            Errors.Clear();
            var ejercicio = await _ejercicioRepository.GetById(id);
            if (ejercicio == null)
            {
                Errors.Add("El ejercicio no existe.");
                return null;
            }

            return _mapper.Map<EjercicioDto>(ejercicio);
        }

        public async Task<EjercicioDto?> CreateEjercicioAsync(EjercicioInsertDto insertDto)
        {
            var ejercicio = _mapper.Map<Ejercicio>(insertDto);

            await _ejercicioRepository.Add(ejercicio);
            await _ejercicioRepository.Save();

            // Refrescamos el ejercicio para obtener las entidades relacionadas y mapear el DTO completo
            var ejercicioCreado = await _ejercicioRepository.GetById(ejercicio.IdEjercicio);

            return _mapper.Map<EjercicioDto>(ejercicioCreado!);
        }

        public async Task<EjercicioDto?> UpdateEjercicioAsync(int id, EjercicioUpdateDto updateDto)
        {
            Errors.Clear();
            var ejercicio = await _ejercicioRepository.GetById(id);
            if (ejercicio == null)
            {
                Errors.Add("El ejercicio no existe.");
                return null;
            }

            _mapper.Map(updateDto, ejercicio);

            _ejercicioRepository.Update(ejercicio);
            await _ejercicioRepository.Save();

            var updatedEjercicio = await _ejercicioRepository.GetById(id);
            return _mapper.Map<EjercicioDto>(updatedEjercicio!);
        }

        public async Task<EjercicioDto?> DeleteEjercicioAsync(int id)
        {
            Errors.Clear();
            var ejercicio = await _ejercicioRepository.GetById(id);
            if (ejercicio == null)
            {
                Errors.Add("El ejercicio no existe.");
                return null;
            }

            var deletedEjercicioDto = _mapper.Map<EjercicioDto>(ejercicio);

            _ejercicioRepository.Delete(ejercicio);
            await _ejercicioRepository.Save();

            return deletedEjercicioDto;
        }
    }
}