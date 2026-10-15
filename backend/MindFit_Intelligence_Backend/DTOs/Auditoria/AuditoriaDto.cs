namespace MindFit_Intelligence_Backend.DTOs.Auditoria
{
    public class AuditoriaEventoFiltroDto
    {
        public DateTime? FechaDesde { get; set; }
        public DateTime? FechaHasta { get; set; }
        public int? IdUsuario { get; set; }
        public string? Entidad { get; set; }
        public int? IdEntidad { get; set; }
        public string? Accion { get; set; }
        public string? Resultado { get; set; }
        public int Pagina { get; set; } = 1;
        public int TamanoPagina { get; set; } = 50;
    }

    public class AuditoriaSesionFiltroDto
    {
        public DateTime? FechaDesde { get; set; }
        public DateTime? FechaHasta { get; set; }
        public int? IdUsuario { get; set; }
        public string? UsernameIntentado { get; set; }
        public string? TipoEvento { get; set; }
        public string? Resultado { get; set; }
        public int Pagina { get; set; } = 1;
        public int TamanoPagina { get; set; } = 50;
    }

    public class AuditoriaEventoDto
    {
        public int IdAuditoriaEvento { get; set; }
        public DateTime FechaHoraUtc { get; set; }
        public int? IdUsuario { get; set; }
        public string? Username { get; set; }
        public int? IdGimnasio { get; set; }
        public string Entidad { get; set; } = string.Empty;
        public int? IdEntidad { get; set; }
        public string Accion { get; set; } = string.Empty;
        public string? Endpoint { get; set; }
        public string? MetodoHttp { get; set; }
        public string? IpAddress { get; set; }
        public string? UserAgent { get; set; }
        public string? ValoresOriginalesJson { get; set; }
        public string? ValoresNuevosJson { get; set; }
        public string? CambiosJson { get; set; }
        public string Resultado { get; set; } = string.Empty;
        public string? Mensaje { get; set; }
    }

    public class AuditoriaSesionDto
    {
        public int IdAuditoriaSesion { get; set; }
        public DateTime FechaHoraUtc { get; set; }
        public int? IdUsuario { get; set; }
        public string? UsernameIntentado { get; set; }
        public int? IdGimnasio { get; set; }
        public string TipoEvento { get; set; } = string.Empty;
        public string Resultado { get; set; } = string.Empty;
        public string? IpAddress { get; set; }
        public string? UserAgent { get; set; }
        public string? MotivoFallo { get; set; }
    }

    public class AuditoriaResultadoDto<T>
    {
        public List<T> Items { get; set; } = new();
        public int Total { get; set; }
        public int Pagina { get; set; }
        public int TamanoPagina { get; set; }
    }

    public class AuditoriaReporteResumenDto
    {
        public int TotalEventos { get; set; }
        public int TotalSesiones { get; set; }
        public List<AuditoriaResumenItemDto> EventosPorAccion { get; set; } = new();
        public List<AuditoriaResumenItemDto> SesionesPorTipo { get; set; } = new();
    }

    public class AuditoriaResumenItemDto
    {
        public string Clave { get; set; } = string.Empty;
        public int Total { get; set; }
    }
}
