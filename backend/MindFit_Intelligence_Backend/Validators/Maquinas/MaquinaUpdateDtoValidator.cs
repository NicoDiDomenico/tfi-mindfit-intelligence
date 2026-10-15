using FluentValidation;
using MindFit_Intelligence_Backend.DTOs.Maquinas;

namespace MindFit_Intelligence_Backend.Validators.Maquinas
{
    public class MaquinaUpdateDtoValidator : AbstractValidator<MaquinaUpdateDto>
    {
        public MaquinaUpdateDtoValidator()
        {
            RuleFor(x => x.NombreMaquina)
                .NotEmpty().WithMessage("El nombre de la máquina es obligatorio.")
                .MaximumLength(100).WithMessage("El nombre de la máquina no puede superar los 100 caracteres.");

            RuleFor(x => x.FechaFabricacion)
                .LessThanOrEqualTo(DateTime.Today).WithMessage("La fecha de fabricación no puede ser futura.");

            RuleFor(x => x.FechaCompra)
                .LessThanOrEqualTo(DateTime.Today).WithMessage("La fecha de compra no puede ser futura.")
                .GreaterThanOrEqualTo(x => x.FechaFabricacion).WithMessage("La fecha de compra no puede ser anterior a la fecha de fabricación.");

            RuleFor(x => x.CostoAdquisicion)
                .GreaterThan(0).WithMessage("El costo de adquisición debe ser mayor a 0.");

            RuleFor(x => x.PesoMaximoLingotera)
                .GreaterThan(0).When(x => x.PesoMaximoLingotera.HasValue)
                .WithMessage("El peso máximo de la lingotera debe ser mayor a 0.");
        }
    }
}
