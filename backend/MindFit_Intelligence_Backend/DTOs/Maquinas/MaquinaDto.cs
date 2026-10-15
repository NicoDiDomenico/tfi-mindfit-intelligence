namespace MindFit_Intelligence_Backend.DTOs.Maquinas
{
    public class MaquinaDto
    {
        public int IdMaquina { get; set; }
        public required string NombreMaquina { get; set; }
        public DateTime FechaFabricacion { get; set; }
        public DateTime FechaCompra { get; set; }
        public decimal CostoAdquisicion { get; set; }
        public decimal? PesoMaximoLingotera { get; set; }
        public bool EsElectrica { get; set; }
    }
}
