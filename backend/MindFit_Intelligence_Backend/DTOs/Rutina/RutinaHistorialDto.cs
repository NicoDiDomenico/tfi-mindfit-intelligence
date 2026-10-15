namespace MindFit_Intelligence_Backend.DTOs.Rutina
{
    public class RutinaHistorialResumenDto
    {
        public int IdRutinaHistorial { get; set; }
        public int IdRutina { get; set; }
        public int Version { get; set; }
        public DateTime FechaSnapshot { get; set; }
        public bool ActivoSnapshot { get; set; }
    }

    public class RutinaHistorialDetalleDto
    {
        public int IdRutinaHistorial { get; set; }
        public int IdRutina { get; set; }
        public int Version { get; set; }
        public DateTime FechaSnapshot { get; set; }
        public bool ActivoSnapshot { get; set; }

        public List<RutinaHistorialCalentamientoDto> Calentamientos { get; set; } = new();
        public List<RutinaHistorialEntrenamientoDto> Entrenamientos { get; set; } = new();
        public List<RutinaHistorialEstiramientoDto> Estiramientos { get; set; } = new();
    }

    public class RutinaHistorialCalentamientoDto
    {
        public int IdEjercicio { get; set; }
        public int Duracion { get; set; }
        public int Orden { get; set; }
        public string? Observaciones { get; set; }
    }

    public class RutinaHistorialEntrenamientoDto
    {
        public int IdEjercicio { get; set; }
        public int Series { get; set; }
        public int Repeticiones { get; set; }
        public decimal? PesoAsignado { get; set; }
        public int? TiempoDescansoSegundos { get; set; }
        public int Orden { get; set; }
        public string? Observaciones { get; set; }
    }

    public class RutinaHistorialEstiramientoDto
    {
        public int IdEjercicio { get; set; }
        public int Duracion { get; set; }
        public int Orden { get; set; }
        public string? Observaciones { get; set; }
    }
}
