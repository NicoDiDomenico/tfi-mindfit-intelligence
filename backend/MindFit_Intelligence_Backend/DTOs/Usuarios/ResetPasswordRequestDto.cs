namespace MindFit_Intelligence_Backend.DTOs.Usuarios
{
    public class ResetPasswordRequestDto
    {
        public string TokenPlano { get; set; } = string.Empty;
        public string NewPassword { get; set; } = string.Empty;
    }
}
