using FluentValidation;
using MindFit_Intelligence_Backend.DTOs.Cuota;

namespace MindFit_Intelligence_Backend.Validators.Cuota
{
    public class CuotaUpdateDtoValidator : AbstractValidator<CuotaUpdateDto>
    {
        public CuotaUpdateDtoValidator()
        {
            RuleFor(x => x.Plan)
                .NotNull().WithMessage("El plan es obligatorio cuando renueva.")
                .When(x => x.renueva);

            RuleFor(x => x.Monto)
                .NotNull().WithMessage("El monto es obligatorio cuando renueva.")
                .GreaterThan(0).WithMessage("El monto debe ser mayor a cero.")
                .When(x => x.renueva);
        }
    }
}
