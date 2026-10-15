namespace MindFit_Intelligence_Backend.Services.Interfaces
{
    public interface ICurrentUserService
    {
        int? IdUsuario { get; }
        string? Username { get; }
        int? IdGimnasio { get; }
        string? IpAddress { get; }
        string? UserAgent { get; }
        string? Endpoint { get; }
        string? MetodoHttp { get; }
    }
}
