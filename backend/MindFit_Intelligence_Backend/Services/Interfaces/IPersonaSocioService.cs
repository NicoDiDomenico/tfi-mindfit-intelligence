using MindFit_Intelligence_Backend.DTOs.Cuota;
using MindFit_Intelligence_Backend.DTOs.Personas;
using MindFit_Intelligence_Backend.DTOs.Rutina;
using MindFit_Intelligence_Backend.Models;
using MindFit_Intelligence_Backend.Models.Enums;

namespace MindFit_Intelligence_Backend.Services.Interfaces
{
    public interface IPersonaSocioService
    {
        Task<IEnumerable<SocioTurnoDto>> GetSociosConTurnoHoyPorEntrenadorYHorario(int idUsuarioResponsable, int idRangoHorario);
        Task SetSocioNuevoAsync(PersonaSocio socio, List<int> diasActivosIds);
        void SetSocioActualizado(PersonaSocio socio, List<int> diasActivosIds);

        // Crea y adjunta la cuota al socio (NO guarda)
        Cuota CrearCuotaInicial(PersonaSocio socio, Plan plan, decimal monto);
        Cuota ActualizarCuota(PersonaSocio socio, Plan plan, decimal monto);

        // Side-effect (mail) -> siempre Task
        Task EnviarEmailBienvenidaAsync(Usuario usuario, Cuota? cuota);
        Task EnviarEmailActualizacionCuotaAsync(Usuario usuario, Cuota? cuota);
    }
}
