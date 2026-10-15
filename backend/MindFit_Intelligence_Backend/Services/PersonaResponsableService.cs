using AutoMapper;
using MindFit_Intelligence_Backend.Models;
using MindFit_Intelligence_Backend.DTOs.Personas;
using MindFit_Intelligence_Backend.Services.Interfaces;
using MindFit_Intelligence_Backend.Repository.Interfaces;
using System.Globalization;

namespace MindFit_Intelligence_Backend.Services
{
    public class PersonaResponsableService : IPersonaResponsableService
    {
        private IPersonaResponsableRepository _PersonaResponsableRepository;
        private IMapper _mapper;
        // falta manejo de errores

        public PersonaResponsableService(IPersonaResponsableRepository PersonaResponsableRepository, IMapper mapper) {
            _PersonaResponsableRepository = PersonaResponsableRepository;
            _mapper = mapper;
        }

        public async Task<IEnumerable<PersonaResponsableDto>> Get()
        {
            IEnumerable<PersonaResponsable> PersonaResponsables = await _PersonaResponsableRepository.Get();

            IEnumerable<PersonaResponsableDto> PersonaResponsablesDtos = PersonaResponsables.Select(p => _mapper.Map<PersonaResponsableDto>(p));

            return PersonaResponsablesDtos;
        }

        public async Task<PersonaResponsableDto?> GetById(int id)
        {
            PersonaResponsable? PersonaResponsable = await _PersonaResponsableRepository.GetById(id);

            if (PersonaResponsable != null)
            {
                PersonaResponsableDto PersonaResponsableDto = _mapper.Map<PersonaResponsableDto>(PersonaResponsable);
                return PersonaResponsableDto;
            }
            return null;
        }
        public async Task<IEnumerable<EntrenadorDto>> GetEntrenadores()
        {
            IEnumerable<PersonaResponsable> entrenadores = await _PersonaResponsableRepository.GetEntrenadores();

            return entrenadores.Select(pr => new EntrenadorDto
            {
                IdUsuario = pr.IdUsuario,
                Nombre = pr.Nombre,
                Apellido = pr.Apellido
            });
        }

        public async Task<IEnumerable<EntrenadorDto>> GetEntrenadoresPorHorario(int idRangoHorario)
        {
            string diaActualNombre = ObtenerNombreDiaActual();
            IEnumerable<PersonaResponsable> entrenadores = await _PersonaResponsableRepository.GetEntrenadoresPorHorario(idRangoHorario, diaActualNombre);

            return entrenadores.Select(pr => new EntrenadorDto
            {
                IdUsuario = pr.IdUsuario,
                Nombre = pr.Nombre,
                Apellido = pr.Apellido
            });
        }

        private static string ObtenerNombreDiaActual()
        {
            return ObtenerNombreDia(DateTime.Today);
        }

        private static string ObtenerNombreDia(DateTime fecha)
        {
            var cultura = new CultureInfo("es-ES");
            string diaCultura = fecha.ToString("dddd", cultura);
            return cultura.TextInfo.ToTitleCase(diaCultura);
        }
    }
}
