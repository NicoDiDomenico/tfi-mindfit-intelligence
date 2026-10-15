namespace MindFit_Intelligence_Backend.DTOs.Usuarios
{
    public class RefreshTokenRequestDto
    {
        public int IdUsuario { get; set; }
        public required string RefreshToken { get; set; }
    }
}
