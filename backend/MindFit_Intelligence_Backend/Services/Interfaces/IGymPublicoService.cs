using MindFit_Intelligence_Backend.DTOs.Gyms;
using MindFit_Intelligence_Backend.DTOs.PayPal;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace MindFit_Intelligence_Backend.Services.Interfaces
{
    public interface IGymPublicoService
    {
        /// <summary>
        /// Obtiene todos los gimnasios activos.
        /// Para uso en pantalla de login (sin autenticación).
        /// </summary>
        Task<IEnumerable<GymPublicoDTO>> GetAllGymsActivosAsync();

        /// <summary>
        /// Registra un nuevo gym en la base maestra y devuelve su Id.
        /// </summary>
        Task<int> RegistrarNuevoGymAsync(
            NuevoGymRequestDto dto,
            PayPalSubscriptionStatusDto paypalSubscription);

        Task<GymSubscriptionDto> GetMiSuscripcionAsync(int idGym);

        Task<GymSubscriptionDto> ActualizarMiSuscripcionAsync(
            int idGym,
            CancellationToken cancellationToken = default);

        Task<GymSubscriptionDto> CancelarMiSuscripcionAsync(
            int idGym,
            CancellationToken cancellationToken = default);

        Task<GymSubscriptionDto> ReactivarMiSuscripcionAsync(
            int idGym,
            CancellationToken cancellationToken = default);

        Task<GymSubscriptionDto> ConfirmarResuscripcionAsync(
            int idGym,
            string payPalSubscriptionId,
            CancellationToken cancellationToken = default);
    }
}
