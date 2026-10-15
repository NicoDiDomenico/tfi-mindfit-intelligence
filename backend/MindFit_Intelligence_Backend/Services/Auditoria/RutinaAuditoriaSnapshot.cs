namespace MindFit_Intelligence_Backend.Services.Auditoria
{
    public class RutinaAuditoriaSnapshot
    {
        public int IdRutina { get; set; }
        public int IdPersonaSocio { get; set; }
        public int IdDia { get; set; }
        public DateTime FechaModificacion { get; set; }
        public bool Activo { get; set; }
        public List<RutinaAuditoriaCalentamiento> Calentamientos { get; set; } = new();
        public List<RutinaAuditoriaEntrenamiento> Entrenamientos { get; set; } = new();
        public List<RutinaAuditoriaEstiramiento> Estiramientos { get; set; } = new();
    }

    public class RutinaAuditoriaCalentamiento
    {
        public int IdEjercicio { get; set; }
        public string? Ejercicio { get; set; }
        public int Duracion { get; set; }
        public int Orden { get; set; }
        public string? Observaciones { get; set; }
    }

    public class RutinaAuditoriaEntrenamiento
    {
        public int IdEjercicio { get; set; }
        public string? Ejercicio { get; set; }
        public int Series { get; set; }
        public int Repeticiones { get; set; }
        public decimal? PesoAsignado { get; set; }
        public int? TiempoDescansoSegundos { get; set; }
        public int Orden { get; set; }
        public string? Observaciones { get; set; }
    }

    public class RutinaAuditoriaEstiramiento
    {
        public int IdEjercicio { get; set; }
        public string? Ejercicio { get; set; }
        public int Duracion { get; set; }
        public int Orden { get; set; }
        public string? Observaciones { get; set; }
    }
}
