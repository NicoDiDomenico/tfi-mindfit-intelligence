using FluentValidation;
using MindFit_Intelligence_Backend.DTOs.Cuota;
using MindFit_Intelligence_Backend.DTOs.PerfilIA;
using MindFit_Intelligence_Backend.DTOs.Personas;

namespace MindFit_Intelligence_Backend.Validators.Personas
{
    public class PersonaSocioUpdateDtoValidator : AbstractValidator<PersonaSocioUpdateDto>
    {
        public PersonaSocioUpdateDtoValidator(
            IValidator<CuotaUpdateDto> cuotaUpdateValidator,
            IValidator<PerfilIAUpdateDto> perfilIAUpdateValidator)
        {
            RuleFor(x => x.Nombre)
                .NotEmpty().WithMessage("El nombre es obligatorio.")
                .MaximumLength(100).WithMessage("El nombre no puede superar los 100 caracteres.");

            RuleFor(x => x.Apellido)
                .NotEmpty().WithMessage("El apellido es obligatorio.")
                .MaximumLength(100).WithMessage("El apellido no puede superar los 100 caracteres.");

            RuleFor(x => x.Email)
                .NotEmpty().WithMessage("El email es obligatorio.")
                .EmailAddress().WithMessage("El formato del email no es válido.")
                .MaximumLength(150).WithMessage("El email no puede superar los 150 caracteres.");

            RuleFor(x => x.Telefono)
                .MaximumLength(50).WithMessage("El teléfono no puede superar los 50 caracteres.")
                .When(x => !string.IsNullOrEmpty(x.Telefono));

            RuleFor(x => x.Direccion)
                .MaximumLength(200).WithMessage("La dirección no puede superar los 200 caracteres.")
                .When(x => !string.IsNullOrEmpty(x.Direccion));

            RuleFor(x => x.Ciudad)
                .MaximumLength(100).WithMessage("La ciudad no puede superar los 100 caracteres.")
                .When(x => !string.IsNullOrEmpty(x.Ciudad));

            RuleFor(x => x.TipoDocumento)
                .NotEmpty().WithMessage("El tipo de documento es obligatorio.")
                .MaximumLength(50).WithMessage("El tipo de documento no puede superar los 50 caracteres.");

            RuleFor(x => x.NroDocumento)
                .NotEmpty().WithMessage("El número de documento es obligatorio.")
                .MaximumLength(50).WithMessage("El número de documento no puede superar los 50 caracteres.");

            RuleFor(x => x.ObraSocial)
                .MaximumLength(100).WithMessage("La obra social no puede superar los 100 caracteres.")
                .When(x => !string.IsNullOrEmpty(x.ObraSocial));

            RuleFor(x => x.Pregunta)
                .MaximumLength(500).WithMessage("La pregunta no puede superar los 500 caracteres.")
                .When(x => !string.IsNullOrEmpty(x.Pregunta));

            RuleFor(x => x.Respuesta)
                .MaximumLength(500).WithMessage("La respuesta no puede superar los 500 caracteres.")
                .When(x => !string.IsNullOrEmpty(x.Respuesta));

            RuleFor(x => x.DiasActivosIds)
                .NotEmpty().WithMessage("Debe informar al menos un día activo.");

            RuleForEach(x => x.DiasActivosIds)
                .GreaterThan(0).WithMessage("Los IDs de día deben ser mayores a 0.");

            RuleFor(x => x.Cuota)
                .NotNull().WithMessage("La cuota es obligatoria.");

            RuleFor(x => x.Cuota)
                .SetValidator(cuotaUpdateValidator)
                .When(x => x.Cuota != null);

            RuleFor(x => x.PerfilIA!)
                .SetValidator(perfilIAUpdateValidator)
                .When(x => x.PerfilIA != null);
        }
    }
}
