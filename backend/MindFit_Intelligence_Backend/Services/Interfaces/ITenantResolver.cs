using System.Threading.Tasks;

namespace MindFit_Intelligence_Backend.Services.Interfaces
{
    public interface ITenantResolver
    {
        /// <summary>
        /// Resuelve la connection string para el gimnasio indicado.
        /// Devuelve null si no existe o no está activo.
        /// </summary>
        Task<string?> ResolveConnectionStringAsync(int idGimnasio);
    }
}