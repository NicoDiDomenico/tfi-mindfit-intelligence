namespace MindFit_Intelligence_Backend.Services.Interfaces
{
    public interface ITenantContext
    {
        int? IdGimnasio { get; }
        string? ConnectionString { get; }

        /// <summary>
        /// Establece el tenant (para la request en curso).
        /// </summary>
        /// <param name="idGimnasio">Id del gimnasio</param>
        /// <param name="connectionString">Connection string resuelta</param>
        void SetTenant(int idGimnasio, string connectionString);
    }
}