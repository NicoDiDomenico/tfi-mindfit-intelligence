using FluentValidation;
using MindFit_Intelligence_Backend.DTOs.Personas;
using MindFit_Intelligence_Backend.DTOs.Usuarios;

namespace MindFit_Intelligence_Backend.Validators.Usuarios
{
    public class UsuarioUpdateDtoValidator : AbstractValidator<UsuarioUpdateDto>
    {
        public UsuarioUpdateDtoValidator(
            IValidator<PersonaResponsableUpdateDto> personaResponsableValidator,
            IValidator<PersonaSocioUpdateDto> personaSocioValidator)
        {
            RuleFor(x => x.Username)
                .NotEmpty().WithMessage("El nombre de usuario es obligatorio.")
                .MaximumLength(100).WithMessage("El nombre de usuario no puede superar los 100 caracteres.");

            RuleFor(x => x.TipoPersona)
                .NotEmpty().WithMessage("El tipo de persona es obligatorio.")
                .Must(t => t == "Responsable" || t == "Socio")
                .WithMessage("El tipo de persona debe ser 'Responsable' o 'Socio'.");

            RuleForEach(x => x.IdGrupos)
                .GreaterThan(0).WithMessage("Los IDs de grupo deben ser mayores a 0.");

            RuleFor(x => x.PersonaResponsable)
                .NotNull().WithMessage("Falta PersonaResponsable.")
                .When(x => x.TipoPersona == "Responsable");

            RuleFor(x => x.PersonaResponsable!)
                .SetValidator(personaResponsableValidator)
                .When(x => x.TipoPersona == "Responsable" && x.PersonaResponsable != null);

            RuleFor(x => x.PersonaSocio)
                .NotNull().WithMessage("Falta PersonaSocio.")
                .When(x => x.TipoPersona == "Socio");

            RuleFor(x => x.PersonaSocio!)
                .SetValidator(personaSocioValidator)
                .When(x => x.TipoPersona == "Socio" && x.PersonaSocio != null);
        }
    }
}
