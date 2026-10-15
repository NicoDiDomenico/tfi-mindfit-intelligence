using AutoMapper;
using MindFit_Intelligence_Backend.DTOs.Calentamiento;
using MindFit_Intelligence_Backend.DTOs.Cuota;
using MindFit_Intelligence_Backend.DTOs.Dia;
using MindFit_Intelligence_Backend.DTOs.Ejercicios;
using MindFit_Intelligence_Backend.DTOs.Entrenamiento;
using MindFit_Intelligence_Backend.DTOs.Equipamientos;
using MindFit_Intelligence_Backend.DTOs.Estiramiento;
using MindFit_Intelligence_Backend.DTOs.GrupoMuscular;
using MindFit_Intelligence_Backend.DTOs.Grupos;
using MindFit_Intelligence_Backend.DTOs.Maquinas;
using MindFit_Intelligence_Backend.DTOs.PerfilIA;
using MindFit_Intelligence_Backend.DTOs.Permisos;
using MindFit_Intelligence_Backend.DTOs.Personas;
using MindFit_Intelligence_Backend.DTOs.Rutina;
using MindFit_Intelligence_Backend.DTOs.TipoEjercicio;
using MindFit_Intelligence_Backend.DTOs.Turno;
using MindFit_Intelligence_Backend.DTOs.Usuarios;
using MindFit_Intelligence_Backend.Models;
using MindFit_Intelligence_Backend.Models.Enums;

namespace MindFit_Intelligence_Backend.Automappers
{
    public class MappingProfile : Profile
    {
        public MappingProfile()
        {
            ///// UsuarioService.cs
            // GetDias()
            CreateMap<Dia, DiaDto>();

            // GetUsuariosGrid()
            CreateMap<Usuario, UsuarioGridDto>()
                .ForMember(d => d.TipoPersona, opt => opt.MapFrom(s =>
                    s.PersonaResponsable != null ? "Responsable" : "Socio"))
                .ForMember(d => d.NombreCompleto, opt => opt.MapFrom(s =>
                    s.PersonaResponsable != null
                        ? $"{s.PersonaResponsable.Apellido} {s.PersonaResponsable.Nombre}"
                        : $"{s.PersonaSocio!.Apellido} {s.PersonaSocio!.Nombre}"))
                .ForMember(d => d.Email, opt => opt.MapFrom(s =>
                    s.PersonaResponsable != null ? s.PersonaResponsable.Email : s.PersonaSocio!.Email));

            // GetUsuariosResponsablesGrid()
            CreateMap<Usuario, ResponsableGridDto>()
                .ForMember(d => d.NombreCompleto, opt => opt.MapFrom(s =>
                    $"{s.PersonaResponsable!.Apellido} {s.PersonaResponsable!.Nombre}"))
                .ForMember(d => d.Email, opt => opt.MapFrom(s =>
                    s.PersonaResponsable!.Email));

            // GetUsuariosSociosGrid()
            CreateMap<Usuario, SocioGridDto>()
                .ForMember(d => d.NombreCompleto, opt => opt.MapFrom(s =>
                    $"{s.PersonaSocio!.Apellido} {s.PersonaSocio!.Nombre}"))
                .ForMember(d => d.Email, opt => opt.MapFrom(s =>
                    s.PersonaSocio!.Email))
                .ForMember(d => d.EstadoSocio, opt => opt.MapFrom(s =>
                    s.PersonaSocio!.EstadoSocio))
                .ForMember(d => d.Plan, opt => opt.MapFrom(s =>
                    s.PersonaSocio!.Cuotas
                        .OrderByDescending(c => c.FechaFinPeriodo)
                        .Select(c => (Plan?)c.Plan)
                        .FirstOrDefault()))
                .ForMember(d => d.FechaFinPeriodo, opt => opt.MapFrom(s =>
                    s.PersonaSocio!.Cuotas
                        .OrderByDescending(c => c.FechaFinPeriodo)
                        .Select(c => (DateTime?)c.FechaFinPeriodo)
                        .FirstOrDefault()));

            // GetUsuarioById(), Delete() y PersonaResponsableService.cs
            CreateMap<Usuario, UsuarioDto>()
                .ForMember(dest => dest.TipoPersona, opt => opt.MapFrom(src =>
                    src.PersonaResponsable != null ? "Responsable" : src.PersonaSocio != null ? "Socio" : ""))
                .ForMember(dest => dest.Grupos, opt => opt.MapFrom(src =>
                    src.UsuarioGrupos.Select(ug => ug.Grupo)));
            CreateMap<Permiso, PermisoDto>();
            CreateMap<Grupo, GrupoDto>()
                .ForMember(dest => dest.Permisos, opt => opt.MapFrom(src =>
                    src.GrupoPermisos.Select(gp => gp.Permiso)));
            CreateMap<PersonaResponsable, PersonaResponsableDto>();
            CreateMap<PersonaSocio, PersonaSocioDto>()
                .ForMember(dest => dest.Rutinas, opt => opt.MapFrom(src =>
                    src.Rutinas.Where(r => r.Activo))); // Solo mapeamos las rutinas activas, las inactivas no se muestran en el detalle del socio
            CreateMap<PerfilIA, PerfilIADto>();
            CreateMap<Rutina, RutinaDto>();

            // CuotaServices.cs
            CreateMap<Cuota, CuotaDto>();

            // Add()
            CreateMap<UsuarioInsertDto, Usuario>()
                .ForMember(dest => dest.UsuarioGrupos, opt => opt.MapFrom(src =>
                    src.IdGrupos.Select(id => new UsuarioGrupo { IdGrupo = id })));
            CreateMap<PersonaResponsableInsertDto, PersonaResponsable>();
            CreateMap<PersonaSocioInsertDto, PersonaSocio>();
            CreateMap<PerfilIAInsertDto, PerfilIA>()
                .ForMember(dest => dest.FechaActualizacion, opt => opt.Ignore());
            CreateMap<RutinaInsertDto, Rutina>();
            //    .ForMember(dest => dest.FechaModificacion, opt => opt.MapFrom(src => DateTime.Now)); // Ya lo hice manualmente en el servicio, no hace falta que lo haga AutoMapper

            // Update()
            CreateMap<UsuarioUpdateDto, Usuario>();
            CreateMap<PersonaResponsableUpdateDto, PersonaResponsable>();
            CreateMap<PersonaSocioUpdateDto, PersonaSocio>()
                .ForMember(dest => dest.PerfilIA, opt => opt.Condition(src => src.PerfilIA != null));
            CreateMap<PerfilIAUpdateDto, PerfilIA>()
                .ForMember(dest => dest.FechaActualizacion, opt => opt.Ignore());
            CreateMap<RutinaUpdateDto, Rutina>()
                .ForMember(dest => dest.FechaModificacion, opt => opt.MapFrom(src => DateTime.Now)); // para mi no hace falta la fecha de modificacion


            //// GrupoService.cs y PermisoService.cs
            // Get(), GetById() y Delete()
            CreateMap<Grupo, GrupoDto>()
                .ForMember(dest => dest.Permisos, opt => opt.MapFrom(src =>
                    src.GrupoPermisos.Select(gp => gp.Permiso)));
            CreateMap<Permiso, PermisoDto>();
            CreateMap<Grupo, GrupoAuthDto>()
                .ForMember(dest => dest.NombreGrupo, opt => opt.MapFrom(src => src.Nombre))
                .ForMember(dest => dest.Permisos, opt => opt.MapFrom(src =>
                    src.GrupoPermisos.Select(gp => gp.Permiso)));
            CreateMap<Permiso, PermisoAuthDto>();

            // Add()
            CreateMap<GrupoInsertDto, Grupo>()
                .ForMember(dest => dest.GrupoPermisos, opt => opt.MapFrom(src =>
                    src.IdPermisos.Select(id => new GrupoPermiso { IdPermiso = id })));

            // Update()
            CreateMap<GrupoUpdateDto, Grupo>()
                .ForMember(dest => dest.GrupoPermisos, opt => opt.MapFrom(src =>
                    src.IdPermisos.Select(id => new GrupoPermiso { IdPermiso = id })));

            // TurnoService.cs
            CreateMap<CupoFecha, CupoFechaDto>();
            CreateMap<Turno, TurnoDto>()
                .ForMember(dest => dest.HoraDesde, opt => opt.MapFrom(src => src.CupoFecha.DiaRangoHorario.RangoHorario.HoraDesde))
                .ForMember(dest => dest.HoraHasta, opt => opt.MapFrom(src => src.CupoFecha.DiaRangoHorario.RangoHorario.HoraHasta))
                .ForMember(dest => dest.NombreDia, opt => opt.MapFrom(src => src.CupoFecha.DiaRangoHorario.Dia.NombreDia))
                .ForMember(dest => dest.NombreResponsable, opt => opt.MapFrom(src => src.PersonaResponsable.Nombre))
                .ForMember(dest => dest.ApellidoResponsable, opt => opt.MapFrom(src => src.PersonaResponsable.Apellido));

            // Maquina
            CreateMap<Maquina, MaquinaDto>();
            CreateMap<MaquinaInsertDto, Maquina>();
            CreateMap<MaquinaUpdateDto, Maquina>();

            // Equipamiento
            CreateMap<Equipamiento, EquipamientoDto>();
            CreateMap<EquipamientoInsertDto, Equipamiento>();
            CreateMap<EquipamientoUpdateDto, Equipamiento>();

            // Grupo Muscular y Tipo Ejercicio (Solo Lectura)
            CreateMap<GrupoMuscular, GrupoMuscularDto>();
            CreateMap<TipoEjercicio, TipoEjercicioDto>();

            // Ejercicio
            CreateMap<Ejercicio, EjercicioDto>();
            CreateMap<EjercicioInsertDto, Ejercicio>();
            CreateMap<EjercicioUpdateDto, Ejercicio>();

            // Gestion Rutina
            CreateMap<Calentamiento, CalentamientoDto>();
            CreateMap<Entrenamiento, EntrenamientoDto>();
            CreateMap<Estiramiento, EstiramientoDto>();
        }
    }
}
