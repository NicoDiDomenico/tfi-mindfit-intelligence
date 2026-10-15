using AutoMapper;
using MindFit_Intelligence_Backend.DTOs.Turno;
using MindFit_Intelligence_Backend.Models;
using MindFit_Intelligence_Backend.Repository.Interfaces;
using MindFit_Intelligence_Backend.Services.Interfaces;

namespace MindFit_Intelligence_Backend.Services
{
    public class TurnoService : ITurnoService
    {
        private readonly IPersonaSocioRepository _socioRepository;
        private readonly ICuotaRepository _cuotaRepository;
        private readonly ITurnoRepository _turnoRepository;
        private readonly IDiaRangoHorarioRepository _diaRangoHorarioRepository;
        private readonly ICupoFechaRepository _cupoFechaRepository;
        private readonly IMapper _mapper;
        private readonly IEmailService _emailService;

        public List<string> Errors { get; } = new();

        public TurnoService(
            IPersonaSocioRepository socioRepository,
            ICuotaRepository cuotaRepository,
            ITurnoRepository turnoRepository,
            IDiaRangoHorarioRepository diaRangoHorarioRepository,
            ICupoFechaRepository cupoFechaRepository,
            IMapper mapper,
            IEmailService emailService)
        {
            _socioRepository = socioRepository;
            _cuotaRepository = cuotaRepository;
            _turnoRepository = turnoRepository;
            _diaRangoHorarioRepository = diaRangoHorarioRepository;
            _cupoFechaRepository = cupoFechaRepository;
            _mapper = mapper;
            _emailService = emailService;
            _emailService = emailService;
        }

        public async Task<IEnumerable<TurnoDto>> GetTurnosByIdUsuarioSocio(int idUsuarioSocio)
        {
            var turnos = await _turnoRepository.GetByIdUsuarioSocio(idUsuarioSocio);

            return turnos.Select(turno => new TurnoDto
            {
                IdTurno = turno.IdTurno,
                // Agregamos el ? y un valor por defecto por si CupoFecha es null
                FechaAlta = turno.CupoFecha?.Fecha ?? default, // Lo dejo con el nombre FechaAlta para no cambiar el frontend, pero realmente es la fecha del turno (CupoFecha.Fecha)
                EstadoTurno = turno.EstadoTurno,

                // Propagamos el ? por toda la cadena de navegación
                HoraDesde = turno.CupoFecha?.DiaRangoHorario?.RangoHorario?.HoraDesde ?? TimeSpan.Zero,
                HoraHasta = turno.CupoFecha?.DiaRangoHorario?.RangoHorario?.HoraHasta ?? TimeSpan.Zero,
                NombreDia = turno.CupoFecha?.DiaRangoHorario?.Dia?.NombreDia ?? string.Empty,

                // Esto estaba bien, mapeando al empleado/responsable
                NombreResponsable = turno.PersonaResponsable?.Nombre ?? string.Empty,
                ApellidoResponsable = turno.PersonaResponsable?.Apellido ?? string.Empty
            }).ToList();
            //return turnos.Select(t => _mapper.Map<TurnoDto>(t));
        }

        public async Task<bool> ValidateAsync(TurnoInsertDto dto)
        {
            Errors.Clear();

            // 1. Validacion del Socio
            var socio = await _socioRepository.GetById(dto.IdUsuarioSocio);
            if (socio is null)
            {
                Errors.Add("El socio no existe.");
                return false;
            }

            if (!socio.PuedeReservarTurno())
            {
                Errors.Add("El socio no puede reservar turno debido a su estado actual.");
                return false;
            }

            // 2. Validacion de Cuota Vigente
            var cuota = await _cuotaRepository.GetCuotaVigente(dto.IdUsuarioSocio);
            if (cuota is null)
            {
                Errors.Add("El socio no tiene una cuota vigente.");
                return false;
            }

            if (!cuota.EstaVigenteParaFecha(dto.Fecha))
            {
                Errors.Add("La fecha del turno supera el período de vigencia de la cuota.");
                return false;
            }

            // 3. Limite de Turno Diario
            var tieneTurno = await _turnoRepository.ExisteTurnoEnFecha(dto.IdUsuarioSocio, dto.Fecha);
            if (tieneTurno)
            {
                Errors.Add("Ya tienes un turno para este día.");
                return false;
            }

            // 4. Validacion de RangoHorario
            var diaRangoHorario = await _diaRangoHorarioRepository.GetById(dto.IdDiaRangoHorario);
            if (diaRangoHorario is null)
            {
                Errors.Add("El rango horario no existe.");
                return false;
            }

            if (!diaRangoHorario.CorrespondeADia(dto.Fecha))
            {
                Errors.Add("El rango horario no está activo o no corresponde al día seleccionado.");
                return false;
            }

            return true;
        }

        public async Task<TurnoDto?> RegistrarTurno(TurnoInsertDto dto)
        {
            // Gestión del CupoFecha (On-Demand)
            var cupoFecha = await _cupoFechaRepository.GetByDiaRangoHorarioYFecha(dto.IdDiaRangoHorario, dto.Fecha);

            if (cupoFecha is null)
            {
                cupoFecha = new CupoFecha
                {
                    IdDiaRangoHorario = dto.IdDiaRangoHorario,
                    Fecha = dto.Fecha.Date,
                    CupoActual = 1
                };
                await _cupoFechaRepository.Add(cupoFecha);
            }
            else
            {
                if (!cupoFecha.TieneDisponibilidad())
                {
                    Errors.Add("El horario está lleno.");
                    return null;
                }
                cupoFecha.IncrementarCupo();
                _cupoFechaRepository.Update(cupoFecha);
            }

            var turno = new Turno
            {
                IdUsuarioResponsable = dto.IdUsuarioResponsable,
                IdUsuarioSocio = dto.IdUsuarioSocio,
                CupoFecha = cupoFecha,
                FechaAlta = DateTime.Now // Fecha en la que se registró el tuno, no confundir con la fecha del turno (CupoFecha.Fecha)
            };
            turno.Iniciar();

            await _turnoRepository.Add(turno);
            await _turnoRepository.Save();

            // Medio al pedo retornar el turno para mi con saber que se registro es suficiente
            var turnoCompleto = await _turnoRepository.GetByIdWithIncludes(turno.IdTurno);

            return new TurnoDto
            {
                IdTurno = turno.IdTurno,
                // Agregamos el ? y un valor por defecto por si CupoFecha es null
                FechaAlta = turno.CupoFecha?.Fecha ?? default, // Lo dejo con el nombre FechaAlta para no cambiar el frontend, pero realmente es la fecha del turno (CupoFecha.Fecha)
                EstadoTurno = turno.EstadoTurno,

                // Propagamos el ? por toda la cadena de navegación
                HoraDesde = turno.CupoFecha?.DiaRangoHorario?.RangoHorario?.HoraDesde ?? TimeSpan.Zero,
                HoraHasta = turno.CupoFecha?.DiaRangoHorario?.RangoHorario?.HoraHasta ?? TimeSpan.Zero,
                NombreDia = turno.CupoFecha?.DiaRangoHorario?.Dia?.NombreDia ?? string.Empty,

                // Esto estaba bien, mapeando al empleado/responsable
                NombreResponsable = turno.PersonaResponsable?.Nombre ?? string.Empty,
                ApellidoResponsable = turno.PersonaResponsable?.Apellido ?? string.Empty
            };
            //return _mapper.Map<TurnoDto>(turnoCompleto);
        }

        public async Task<bool> CancelarTurno(int idTurno)
        {
            Errors.Clear();

            var turno = await _turnoRepository.GetByIdWithIncludes(idTurno);

            if (turno is null)
            {
                Errors.Add("El turno no existe.");
                return false;
            }

            if (!turno.ValidarAntelacion(Errors))
            {
                return false;
            }

            turno.Cancelar();

            if (turno.CupoFecha != null)
            {
                turno.CupoFecha.DecrementarCupo();
            }

            await _turnoRepository.Save();

            // 3. RF29 - Enviar correo confirmando la cancelación
            if (!string.IsNullOrEmpty(turno.PersonaSocio?.Email))
            {
                // Formateamos fecha y hora para que se vea bien en el correo
                string fechaFormateada = turno.CupoFecha!.Fecha.ToString("dd/MM/yyyy");
                string horaFormateada = turno.CupoFecha.DiaRangoHorario.RangoHorario.HoraDesde.ToString(@"hh\:mm");

                string subject = "Cancelación de Turno - MindFit Intelligence";

                // Armamos un HTML básico. Puedes mejorarlo con estilos en línea (CSS inline)
                string htmlBody = $@"
                    <div style='font-family: Arial, sans-serif; color: #333;'>
                        <h2>Hola {turno.PersonaSocio.Nombre},</h2>
                        <p>Te confirmamos que tu turno ha sido cancelado exitosamente.</p>
                        <ul>
                            <li><strong>Fecha:</strong> {fechaFormateada}</li>
                            <li><strong>Hora:</strong> {horaFormateada} hs</li>
                        </ul>
                        <p>¡Esperamos verte pronto!</p>
                        <hr>
                        <p style='font-size: 12px; color: #777;'>MindFit Intelligence - Sistema de Gestión</p>
                    </div>";

                try
                {
                    // Llamamos a tu SmtpEmailService
                    await _emailService.SendAsync(turno.PersonaSocio.Email, subject, htmlBody);
                }
                catch (Exception ex)
                {
                    // Buena práctica a implementar: Si el correo falla (ej: error de SMTP),
                    // NO frenamos el proceso porque en la base de datos el turno YA se canceló.
                    // Idealmente aquí podrías loguear el error: _logger.LogError(ex, "Error al enviar email de cancelación");
                    Console.WriteLine($"Error al enviar correo: {ex.Message}");
                }
            }

            return true;
        }

        public async Task<bool> ValidarIngresoAsync(ValidarIngresoDto dto)
        {
            Errors.Clear();

            // Buscar un turno en estado "EnCurso" para la fecha actual y que coincida el documento
            var turno = await _turnoRepository.GetTurnoParaIngresoByDniAsync(dto.DniSocio, DateTime.Today);

            if (turno is null)
                return false;

            // Cambiar estado a Finalizado
            turno.Finalizar();

            await _turnoRepository.Save();

            return true;
        }

        public async Task<int> ProcesarTurnosVencidos()
        {
            List<Turno> turnos = await _turnoRepository.GetTurnosEnCurso();
            if (turnos.Count == 0) return 0;

            int contadorVencidos = 0;
            foreach (Turno t in turnos)
            {
                if (t.ValidarVencimiento())
                {
                    t.Vencido();
                    contadorVencidos++;
                }
            }

            await _turnoRepository.Save();
            return contadorVencidos;
        }

        public async Task<IEnumerable<TurnoDetalleDto>> GetTurnosPorFechaAsync(DateTime? fecha)
        {
            // Si 'fecha' es null (no se envió en la URL), se asigna DateTime.Today por defecto.
            DateTime fechaFiltro = fecha ?? DateTime.Today;

            return await _turnoRepository.GetTurnosDetallePorFechaAsync(fechaFiltro);
        }
    }
}
