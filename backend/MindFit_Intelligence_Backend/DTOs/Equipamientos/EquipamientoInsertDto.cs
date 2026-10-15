namespace MindFit_Intelligence_Backend.DTOs.Equipamientos
{
    public class EquipamientoInsertDto
    {
        public required string NombreEquipo { get; set; }
        public decimal CostoAdquisicion { get; set; }
        public decimal? PesoFijoKg { get; set; }
    }
}