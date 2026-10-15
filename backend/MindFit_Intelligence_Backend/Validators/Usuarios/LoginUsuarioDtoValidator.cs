using FluentValidation;
using MindFit_Intelligence_Backend.DTOs.Usuarios;

namespace MindFit_Intelligence_Backend.Validators.Usuarios
{
    public class LoginUsuarioDtoValidator : AbstractValidator<LoginUsuarioDto>
    {
        public LoginUsuarioDtoValidator()
        {
            RuleFor(x => x.Username)
                .NotEmpty().WithMessage("El nombre de usuario es obligatorio.")
                .MaximumLength(100).WithMessage("El nombre de usuario no puede superar los 100 caracteres.");

            RuleFor(x => x.Password)
                .NotEmpty().WithMessage("La contraseña es obligatoria.");
        }
    }
}
