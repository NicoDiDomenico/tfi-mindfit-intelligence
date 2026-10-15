namespace MindFit_Intelligence_Backend.DTOs.SocioInsights
{
    public class SocioRecomendacionDto
    {
        public required string Id { get; set; }
        public required string Tipo { get; set; }
        public required string Prioridad { get; set; }
        public required string Titulo { get; set; }
        public required string Mensaje { get; set; }
        public string? AccionTexto { get; set; }
        public string? AccionUrl { get; set; }
    }
}
