namespace MindFit_Intelligence_Backend.DTOs.Gyms
{
    /// <summary>
    /// DTO público con información básica del gimnasio para dropdown de login.
    /// </summary>
    public class GymPublicoDTO
    {
        public int IdGym { get; set; }
        public string NombreGym { get; set; } = string.Empty;
    }
}