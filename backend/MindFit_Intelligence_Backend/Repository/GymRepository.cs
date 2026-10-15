using Microsoft.EntityFrameworkCore;
using MindFit_Intelligence_Backend.DTOs.Gyms;
using MindFit_Intelligence_Backend.Models.Master;
using MindFit_Intelligence_Backend.Repository.Interfaces;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace MindFit_Intelligence_Backend.Repository
{
    public class GymRepository : IGymRepository
    {
        private readonly MindFitMasterContext _masterContext;

        public GymRepository(MindFitMasterContext masterContext)
        {
            _masterContext = masterContext;
        }

        public async Task<IEnumerable<GymPublicoDTO>> GetAllGymsActivosAsync()
        {
            return await _masterContext.Gyms
                .Where(g => g.Activo)
                .Select(g => new GymPublicoDTO
                {
                    IdGym = g.IdGym,
                    NombreGym = g.NombreGym
                })
                .OrderBy(g => g.NombreGym)
                .AsNoTracking()
                .ToListAsync();
        }

        public async Task<bool> ExistsByNombreAsync(string nombreGym)
        {
            return await _masterContext.Gyms
                .AsNoTracking()
                .AnyAsync(g => g.NombreGym == nombreGym);
        }

        public async Task<int> AddGymAsync(Gym gym)
        {
            _masterContext.Gyms.Add(gym);
            await _masterContext.SaveChangesAsync();
            return gym.IdGym;
        }

        public async Task<Gym?> GetByIdAsync(int idGym)
        {
            return await _masterContext.Gyms
                .AsNoTracking()
                .FirstOrDefaultAsync(g => g.IdGym == idGym);
        }

        public async Task ActualizarActivoAsync(int idGym, bool activo)
        {
            Gym? gym = await _masterContext.Gyms.FindAsync(idGym);

            if (gym is null)
                throw new InvalidOperationException("No se encontro el gimnasio a actualizar.");

            gym.Activo = activo;
            await _masterContext.SaveChangesAsync();
        }

        public async Task<bool> ActualizarSuscripcionPayPalAsync(
            string paypalSubscriptionId,
            string estadoSuscripcionPayPal,
            string? payPalPlanId,
            DateTime? fechaProximoPagoUtc,
            DateTime? fechaEstadoSuscripcionUtc,
            DateTime fechaUltimaVerificacionPayPalUtc)
        {
            Gym? gym = await _masterContext.Gyms
                .FirstOrDefaultAsync(g => g.PayPalSubscriptionId == paypalSubscriptionId);

            if (gym is null)
                return false;

            gym.EstadoSuscripcionPayPal = estadoSuscripcionPayPal;
            gym.PayPalPlanId = payPalPlanId ?? gym.PayPalPlanId;
            gym.FechaProximoPagoUtc = fechaProximoPagoUtc;
            gym.FechaEstadoSuscripcionUtc = fechaEstadoSuscripcionUtc;
            gym.FechaUltimaVerificacionPayPalUtc = fechaUltimaVerificacionPayPalUtc;

            var hasHistory = await _masterContext.GymPayPalSubscriptionHistorial
                .AnyAsync(h => h.IdGym == gym.IdGym);

            if (!hasHistory)
            {
                _masterContext.GymPayPalSubscriptionHistorial.Add(new GymPayPalSubscriptionHistorial
                {
                    IdGym = gym.IdGym,
                    PayPalSubscriptionId = gym.PayPalSubscriptionId!,
                    PayPalPlanId = gym.PayPalPlanId,
                    EstadoPayPal = gym.EstadoSuscripcionPayPal,
                    FechaInicioUtc = gym.FechaCreacion,
                    FechaFinAccesoUtc = gym.FechaAccesoHastaUtc,
                    Motivo = "AltaInicialDetectada",
                    FechaRegistroUtc = DateTime.UtcNow
                });
            }

            await _masterContext.SaveChangesAsync();
            return true;
        }
    }
}
