using FluentValidation;
using MindFit_Intelligence_Backend.DTOs.Equipamientos;

namespace MindFit_Intelligence_Backend.Validators.Equipamientos
{
    public class EquipamientoInsertDtoValidator : AbstractValidator<EquipamientoInsertDto>
    {
        public EquipamientoInsertDtoValidator()
        {
            RuleFor(x => x.NombreEquipo)
                .NotEmpty().WithMessage("El nombre del equipamiento es obligatorio.")
                .MaximumLength(100).WithMessage("El nombre del equipamiento no puede superar los 100 caracteres.");

            RuleFor(x => x.CostoAdquisicion)
                .GreaterThan(0).WithMessage("El costo de adquisición debe ser mayor a 0.");

            RuleFor(x => x.PesoFijoKg)
                .GreaterThan(0).When(x => x.PesoFijoKg.HasValue)
                .WithMessage("El peso fijo debe ser mayor a 0.");
        }
    }
}
