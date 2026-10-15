using AutoMapper;
using MindFit_Intelligence_Backend.DTOs.Cuota;
using MindFit_Intelligence_Backend.Models;
using MindFit_Intelligence_Backend.Models.Enums;
using MindFit_Intelligence_Backend.Repository.Interfaces;
using MindFit_Intelligence_Backend.Services.Interfaces;

namespace MindFit_Intelligence_Backend.Services
{
    public class CuotaService : ICuotaService
    {
        private readonly ICuotaRepository _cuotaRepository;
        private readonly IMapper _mapper;

        public CuotaService(ICuotaRepository cuotaRepository, IMapper mapper)
        {
            _cuotaRepository = cuotaRepository;
            _mapper = mapper;
        }

        public async Task<IEnumerable<CuotaDto>> GetBySocio(int idUsuario)
        {
            IEnumerable<Cuota> cuotas = await _cuotaRepository.GetBySocio(idUsuario);
            return _mapper.Map<IEnumerable<CuotaDto>>(cuotas);
        }

        public async Task<CuotaDto?> GetById(int id)
        {
            Cuota? cuota = await _cuotaRepository.GetById(id);
            return cuota == null ? null : _mapper.Map<CuotaDto>(cuota);
        }

        public async Task<int> ActualizarCuotasVencidas()
        {
            var cuotasCandidatas = await _cuotaRepository.GetVencidas();

            foreach (var cuota in cuotasCandidatas)
            {
                cuota.MarcarComoVencida();
            }

            await _cuotaRepository.Save();

            foreach (var cuota in cuotasCandidatas)
            {
                var cuotaVigente = await _cuotaRepository.GetCuotaVigente(cuota.IdUsuario);
                if (cuotaVigente == null)
                    cuota.PersonaSocio.MarcarComoSuspendido();
            }

            await _cuotaRepository.Save();
            return cuotasCandidatas.Count();
        }

        public async Task<CuotaDto?> Delete(int id)
        {
            Cuota? cuota = await _cuotaRepository.GetById(id);
            if (cuota == null) return null;

            CuotaDto cuotaDto = _mapper.Map<CuotaDto>(cuota);
            _cuotaRepository.Delete(cuota);
            await _cuotaRepository.Save();

            return cuotaDto;
        }
    }
}
