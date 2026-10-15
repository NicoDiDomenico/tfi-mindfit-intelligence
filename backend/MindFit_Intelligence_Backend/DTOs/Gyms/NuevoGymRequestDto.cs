using MindFit_Intelligence_Backend.DTOs.Gyms;

namespace MindFit_Intelligence_Backend.DTOs.Gyms
{
    public class NuevoGymRequestDto
    {
        public string NombreGym { get; set; } = null!;

        public string PayPalSubscriptionId { get; set; } = null!;

        // El usuario dueño que se va a crear junto con este gimnasio
        public UsuarioMasterInsertDto UsuarioMaster { get; set; } = null!;
    }
}
