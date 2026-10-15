using MindFit_Intelligence_Backend.Services.Interfaces;

namespace MindFit_Intelligence_Backend.Services
{
    public class TenantContext : ITenantContext
    {
        private int? _idGimnasio;
        private string? _connectionString;

        public int? IdGimnasio => _idGimnasio;
        public string? ConnectionString => _connectionString;

        public void SetTenant(int idGimnasio, string connectionString)
        {
            _idGimnasio = idGimnasio;
            _connectionString = connectionString;
        }
    }
}