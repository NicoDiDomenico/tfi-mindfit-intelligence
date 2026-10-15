namespace MindFit_Intelligence_Backend.DTOs.Usuarios
{
    public class TokenResponseDto
    {
        public required string AccessToken { get; set; }
        public required string RefreshToken { get; set; }
        public List<string> Permisos { get; set; } = new List<string>();
        public required DatosPersonalesDto DatosPersonales { get; set; }
    }
}
