using FluentValidation;
using MindFit_Intelligence_Backend.DTOs.Usuarios;

namespace MindFit_Intelligence_Backend.Validators.Usuarios
{
    public class ChangePasswordRequestDtoValidator : AbstractValidator<ChangePasswordRequestDto>
    {
        public ChangePasswordRequestDtoValidator()
        {
            RuleFor(x => x.CurrentPassword)
                .NotEmpty().WithMessage("La contraseña actual es obligatoria.");

            RuleFor(x => x.NewPassword)
                .NotEmpty().WithMessage("La nueva contraseña es obligatoria.")
                .MinimumLength(8).WithMessage("La nueva contraseña debe tener al menos 8 caracteres.");
        }
    }
}
