namespace MindFit_Intelligence_Backend.DTOs.Usuarios
{
    public class DatosPersonalesDto
    {
        public int Id { get; set; }
        public string? Nombre { get; set; }
        public string? Apellido { get; set; }
        public List<string>? Rol { get; set; }
    }
}
