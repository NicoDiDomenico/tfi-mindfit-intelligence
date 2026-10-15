using AutoMapper;
using MindFit_Intelligence_Backend.DTOs.Cuota;
using MindFit_Intelligence_Backend.DTOs.Personas;
using MindFit_Intelligence_Backend.DTOs.Usuarios;
using MindFit_Intelligence_Backend.Models;
using MindFit_Intelligence_Backend.Models.Enums;
using MindFit_Intelligence_Backend.Repository.Interfaces;
using MindFit_Intelligence_Backend.Services.Interfaces;
using System.Collections.Generic;
namespace MindFit_Intelligence_Backend.Services
{
    public class UsuarioService : IUsuarioService
    {
        private IUsuarioRepository _usuarioRepository;
        private IPersonaResponsableRepository _personaResponsableRepository;
        private IPersonaSocioRepository _personaSocioRepository;
        private IMapper _mapper;
        private IAuthService _authService; // Servicio de autenticación (JWT)
        private IPersonaSocioService _personaSocioService;
        private ICuotaRepository _cuotaRepository;
        public List<string> Errors { get; }

        public UsuarioService(
            IAuthService authService,
            IUsuarioRepository usuarioRepository,
            IPersonaResponsableRepository personaResponsableRepository,
            IPersonaSocioRepository personaSocioRepository,
            IMapper mapper,
            IPersonaSocioService personaSocioService,
            ICuotaRepository cuotaRepository)
        {
            _usuarioRepository = usuarioRepository;
            _personaResponsableRepository = personaResponsableRepository;
            _personaSocioRepository = personaSocioRepository;
            _mapper = mapper;
            _authService = authService;
            Errors = new List<string>();
            _personaSocioService = personaSocioService;
            _cuotaRepository = cuotaRepository;
        }

        private static string? GetEmail(UsuarioInsertDto dto)
            => dto.PersonaResponsable?.Email ?? dto.PersonaSocio?.Email;

        private static string? GetEmail(UsuarioUpdateDto dto)
            => dto.PersonaResponsable?.Email ?? dto.PersonaSocio?.Email;

        public async Task<bool> ValidateEmailAsync(UsuarioInsertDto dto)
        {
            Errors.Clear();

            string? email = GetEmail(dto);
            if (string.IsNullOrWhiteSpace(email))
                return true;

            PersonaResponsable? responsable = await _personaResponsableRepository.GetByEmail(email);
            if (responsable != null)
            {
                Errors.Add("El email ya está registrado.");
                return false;
            }

            PersonaSocio? socio = await _personaSocioRepository.GetByEmail(email);
            if (socio != null)
            {
                Errors.Add("El email ya está registrado.");
                return false;
            }

            return true;
        }

        public async Task<bool> ValidateEmailAsync(int idUsuario, UsuarioUpdateDto dto)
        {
            Errors.Clear();

            string? email = GetEmail(dto);
            if (string.IsNullOrWhiteSpace(email))
                return true;

            PersonaResponsable? responsable = await _personaResponsableRepository.GetByEmail(email);
            if (responsable != null && responsable.IdUsuario != idUsuario)
            {
                Errors.Add("El email ya está registrado.");
                return false;
            }

            PersonaSocio? socio = await _personaSocioRepository.GetByEmail(email);
            if (socio != null && socio.IdUsuario != idUsuario)
            {
                Errors.Add("El email ya está registrado.");
                return false;
            }

            return true;
        }

        public async Task<Usuario?> GetById(int id)
        {
            return await _usuarioRepository.GetById(id);
        }

        // Acá el front obtiene info esencial para la grilla de Usuarios (tanto Socio como responsables), después con el método GetUsuarioResponsableById obtiene el detalle completo del usuario responsable seleccionado
        public async Task<List<UsuarioGridDto>> GetUsuariosGrid()
        {
            List<Usuario> usuarios = await _usuarioRepository.GetUsuariosResponsablesYSocios();

            List<UsuarioGridDto> usuariosGridDto = _mapper.Map<List<UsuarioGridDto>>(usuarios);

            return usuariosGridDto;
        }

        // Acá el front obtiene info esencial para la grilla de Socios
        public async Task<List<SocioGridDto>> GetUsuariosSociosGrid()
        {
            List<Usuario> usuarios = await _usuarioRepository.GetUsuariosSocios();

            List<SocioGridDto> sociosGridDto = _mapper.Map<List<SocioGridDto>>(usuarios);

            foreach (var socioDto in sociosGridDto)
            {
                socioDto.NroDocumento = usuarios
                    .Where(u => u.IdUsuario == socioDto.IdUsuario)
                    .Select(u => u.PersonaSocio?.NroDocumento)
                    .FirstOrDefault();
            }

            return sociosGridDto;
        }

        // Acá el front obtiene info esencial para la grilla de Responsables
        public async Task<List<ResponsableGridDto>> GetUsuariosResponsablesGrid()
        {
            List<Usuario> usuarios = await _usuarioRepository.GetUsuariosResponsables();

            List<ResponsableGridDto> responsablesGridDto = usuarios
                .Select(usuario =>
                {
                    ResponsableGridDto dto = _mapper.Map<ResponsableGridDto>(usuario);
                    dto.NombreGrupo = usuario.UsuarioGrupos
                        .Select(ug => ug.Grupo.Nombre)
                        .ToList();
                    return dto;
                })
                .ToList();

            return responsablesGridDto;
        }

        // Con este metodo el front obtiene toda la info del usuario cuando lo selecciona de la grilla
        public async Task<UsuarioDto?> GetUsuarioById(int idUsuario)
        {
            Usuario? usuario = await _usuarioRepository.GetUsuarioCompletoById(idUsuario);
            if (usuario is null) return null;

            // AutoMapper se encarga de recorrer los objetos y colecciones anidadas
            UsuarioDto usuarioDto = _mapper.Map<UsuarioDto>(usuario);

            return usuarioDto;
        }

        public async Task<UsuarioDto?> Add(UsuarioInsertDto dto)
        {
            Errors.Clear();
            bool esSocio = dto.TipoPersona == "Socio" && dto.PersonaSocio != null;

            Usuario usuario = _mapper.Map<Usuario>(dto);
            _authService.SetPasswordHash(usuario, dto);

            Cuota? cuotaInicial = null;

            if (esSocio)
            {
                await _personaSocioService.SetSocioNuevoAsync(
                    usuario.PersonaSocio!,
                    dto.PersonaSocio!.DiasActivosIds
                );

                ActualizarFechaPerfilIA(usuario.PersonaSocio);

                cuotaInicial = _personaSocioService.CrearCuotaInicial(
                    usuario.PersonaSocio!,
                    dto.PersonaSocio!.Cuota.Plan,
                    dto.PersonaSocio!.Cuota.Monto
                );
            }

            await _usuarioRepository.Add(usuario);
            await _usuarioRepository.Save(); // EF inserta todo el grafo

            if (esSocio)
            {
                await _personaSocioService.EnviarEmailBienvenidaAsync(usuario, cuotaInicial);
            }

            return await GetUsuarioById(usuario.IdUsuario);
        }

        public async Task<UsuarioDto?> Update(int id, UsuarioUpdateDto dto)
        {
            Errors.Clear();
            Cuota? cuotaActualizada = null;

            // 1) Traer entidades a actualizar
            Usuario? usuario = await _usuarioRepository.GetById(id);
            if (usuario == null) return null;

            if (dto.TipoPersona == "Responsable" && dto.PersonaSocio == null)
            {
                PersonaResponsable? pr = await _personaResponsableRepository.GetById(id);
                if (pr == null) return null;

                usuario.PersonaResponsable = pr;
                usuario.PersonaSocio = null;      // por coherencia

                pr.Usuario = usuario;             // opcional pero prolijo
            }
            else // Socio
            {
                PersonaSocio? ps = await _personaSocioRepository.GetById(id);
                if (ps == null) return null;

                usuario.PersonaSocio = ps;
                usuario.PersonaResponsable = null;

                ps.Usuario = usuario;

                PrepararPerfilIAParaUpdate(ps, id, dto.PersonaSocio?.PerfilIA != null);

                _personaSocioService.SetSocioActualizado(usuario.PersonaSocio, dto.PersonaSocio!.DiasActivosIds);
                if (dto.PersonaSocio.Cuota.renueva)
                {
                    if (!dto.PersonaSocio.Cuota.Plan.HasValue || !dto.PersonaSocio.Cuota.Monto.HasValue)
                    {
                        Errors.Add("Plan y Monto son obligatorios cuando se renueva la cuota.");
                        return null;
                    }

                    cuotaActualizada = _personaSocioService.ActualizarCuota(
                        usuario.PersonaSocio!,
                        dto.PersonaSocio.Cuota.Plan.Value,
                        dto.PersonaSocio.Cuota.Monto.Value
                    );
                }
            }

            // Un solo map actualiza Usuario + PersonaX (porque ya está conectada)
            _mapper.Map(dto, usuario);
            ActualizarFechaPerfilIA(usuario.PersonaSocio, id, dto.PersonaSocio?.PerfilIA != null);

            // 3) Si actualizás grupos acá (opcional)
            if (dto.IdGrupos != null)
            {
                await _usuarioRepository.ReplaceUsuarioGrupos(id, dto.IdGrupos);
            }

            await _usuarioRepository.Save();

            if (cuotaActualizada != null)
                await _personaSocioService.EnviarEmailActualizacionCuotaAsync(usuario, cuotaActualizada);

            // 4) Devolver “completo” usando el método que ya tenés
            UsuarioDto? usuarioDto = await GetUsuarioById(id);

            if (usuarioDto == null)
            {
                Errors.Add("Error inesperado al obtener el usuario actualizado de la BD");
                return null;
            }

            return usuarioDto;
        }

        private static void PrepararPerfilIAParaUpdate(PersonaSocio socio, int idUsuario, bool debeActualizarPerfilIA)
        {
            if (!debeActualizarPerfilIA)
            {
                return;
            }

            socio.PerfilIA ??= new PerfilIA
            {
                IdUsuario = idUsuario
            };
        }

        private static void ActualizarFechaPerfilIA(PersonaSocio? socio, int? idUsuario = null, bool debeActualizarPerfilIA = true)
        {
            if (!debeActualizarPerfilIA || socio?.PerfilIA == null)
            {
                return;
            }

            if (idUsuario.HasValue)
            {
                socio.PerfilIA.IdUsuario = idUsuario.Value;
            }

            socio.PerfilIA.FechaActualizacion = DateTime.Now;
        }

        public async Task<UsuarioDto?> RecoverSoftDeletedSocio(int idUsuario)
        {
            PersonaSocio? personaSocio = await _personaSocioRepository.GetById(idUsuario);
            if (personaSocio == null) return null;

            personaSocio.MarcarComoActualizado();
            await _usuarioRepository.Save();

            return await GetUsuarioById(idUsuario);
        }

        public async Task<UsuarioDto?> Delete(int id)
        {
            Usuario? usuarioRestore = await _usuarioRepository.GetUsuarioCompletoById(id);
            if (usuarioRestore == null)
                return null;
            UsuarioDto usuarioDto = _mapper.Map<UsuarioDto>(usuarioRestore);

            Usuario? usuarioDelete = await _usuarioRepository.GetById(id);
            if (usuarioDelete == null)
                return null;

            _usuarioRepository.Delete(usuarioDelete); // Se elimina tambien las relaciones debido al Cascade Delete
            await _usuarioRepository.Save();

            return usuarioDto;
        }

        public async Task<UsuarioDto?> AutoSoftDeleteSocio(int idUsuario)
        {
            var cuota = await _cuotaRepository.GetUltimaCuotaSocio(idUsuario);
            var socio = await _personaSocioRepository.GetById(idUsuario);

            if (cuota == null || socio == null) return null;

            // Solo entramos si cumple la regla de los 30 días
            if (cuota.SuperaMargenDeGracia())
            {
                socio.MarcarComoEliminado();
                await _usuarioRepository.Save();
                return await GetUsuarioById(idUsuario);
            }

            return null; // No cumplió la regla, no hacemos nada
        }

        public async Task<ProcesarEliminacionesDto> ProcesarEliminacionesAutomaticas()
        {
            var sociosSuspendidos = await _personaSocioRepository.GetSociosSuspendidos();
            var idsEliminados = new List<int>();

            foreach (var socio in sociosSuspendidos)
            {
                var cuota = await _cuotaRepository.GetUltimaCuotaSocio(socio.IdUsuario);

                // Verificar si cumple la regla de los 30 días
                if (cuota != null && cuota.SuperaMargenDeGracia())
                {
                    socio.MarcarComoEliminado();
                    idsEliminados.Add(socio.IdUsuario);
                }
            }

            if (idsEliminados.Any())
            {
                await _usuarioRepository.Save();
            }

            return new ProcesarEliminacionesDto
            {
                SociosElimidados = idsEliminados.Count,
                IdsProcesados = idsEliminados,
                Mensaje = $"Se eliminaron automáticamente {idsEliminados.Count} socios."
            };
        }

        public async Task<UsuarioDto?> SoftDeleteSocio(int id)
        {
            PersonaSocio? personaSocio = await _personaSocioRepository.GetById(id);
            if (personaSocio == null) return null;

            personaSocio.MarcarComoEliminado();
            await _usuarioRepository.Save();

            return await GetUsuarioById(id);
        }


        public async Task<bool> ValidateDelete(int id)
        {
            Errors.Clear();

            IEnumerable<Cuota> cuotas = await _cuotaRepository.GetBySocio(id);

            // Le pedimos a la colección de cuotas que verifique si alguna "impide la eliminación"
            bool tieneCuotaActiva = cuotas.Any(c => c.ImpideEliminacionSocio());

            if (tieneCuotaActiva)
                Errors.Add("No se puede eliminar el socio con la cuota al día.");

            return !Errors.Any();
        }


        public bool Validate(UsuarioInsertDto dto)
        {
            Errors.Clear();

            if (dto.TipoPersona != "Responsable" && dto.TipoPersona != "Socio")
                Errors.Add("TipoPersona inválido");

            bool tieneResp = dto.PersonaResponsable != null;
            bool tieneSocio = dto.PersonaSocio != null;

            if (!tieneResp && !tieneSocio)
                Errors.Add("Debe venir PersonaResponsable o PersonaSocio");

            if (tieneResp && tieneSocio)
                Errors.Add("No puede tener ambas personas");

            if (dto.TipoPersona == "Responsable" && !tieneResp)
                Errors.Add("Falta PersonaResponsable");

            if (dto.TipoPersona == "Socio" && !tieneSocio)
                Errors.Add("Falta PersonaSocio");

            return !Errors.Any();
        }

        public bool Validate(UsuarioUpdateDto dto)
        {
            Errors.Clear();

            if (dto.TipoPersona != "Responsable" && dto.TipoPersona != "Socio")
                Errors.Add("TipoPersona inválido");

            bool tieneResp = dto.PersonaResponsable != null;
            bool tieneSocio = dto.PersonaSocio != null;

            if (tieneResp && tieneSocio)
                Errors.Add("No puede venir ambas personas");

            if (dto.TipoPersona == "Responsable" && !tieneResp)
                Errors.Add("Falta PersonaResponsable");

            if (dto.TipoPersona == "Socio" && !tieneSocio)
                Errors.Add("Falta PersonaSocio");

            return !Errors.Any();
        }
        public async Task<bool> UsuarioTienePermiso(int idUsuario, string nombrePermiso)
        {
            return await _usuarioRepository.UsuarioTienePermiso(idUsuario, nombrePermiso);
        }

        // No se tednria que llegar a esta validacion si el front-end es correcto ya que este método se llama desde un botón que solo aparece en los Socios Eliminados, pero lo dejo por las dudas para evitar errores inesperados
        public async Task<bool> ValidateRecover( int idUsuario)
        {
            Errors.Clear();

            Usuario? usuario = await _usuarioRepository.GetUsuarioCompletoById(idUsuario);

            // Verificamos si existe el socio y si él mismo se considera "recuperable"
            if (usuario?.PersonaSocio == null || !usuario.PersonaSocio.PuedeSerRecuperado())
                Errors.Add("El Socio no se encuentra en un estado que permita su recuperación.");

            return !Errors.Any();
        }
    }
}
