namespace MindFit_Intelligence_Backend.DTOs.Formularios
{
    public class FormularioDto
    {
        public int IdFormulario { get; set; }
        public string NombreFormulario { get; set; } = string.Empty;
        public List<string> Permisos { get; set; } = new List<string>();
    }
}
