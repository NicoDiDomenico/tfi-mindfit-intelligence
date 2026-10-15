namespace MindFit_Intelligence_Backend.DTOs.Equipamientos
{
    public class EquipamientoDto
    {
        public int IdEquipamiento { get; set; }
        public required string NombreEquipo { get; set; }
        public decimal CostoAdquisicion { get; set; }
        public decimal? PesoFijoKg { get; set; }
    }
}