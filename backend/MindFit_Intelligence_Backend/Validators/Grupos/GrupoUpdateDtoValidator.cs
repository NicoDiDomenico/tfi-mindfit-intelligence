using FluentValidation;
using MindFit_Intelligence_Backend.DTOs.Grupos;

namespace MindFit_Intelligence_Backend.Validators.Grupos
{
    public class GrupoUpdateDtoValidator : AbstractValidator<GrupoUpdateDto>
    {
        public GrupoUpdateDtoValidator()
        {
            RuleFor(x => x.Nombre)
                .NotEmpty().WithMessage("El nombre del grupo es obligatorio.")
                .MaximumLength(100).WithMessage("El nombre del grupo no puede superar los 100 caracteres.");

            RuleFor(x => x.Descripcion)
                .NotEmpty().WithMessage("La descripción del grupo es obligatoria.")
                .MaximumLength(500).WithMessage("La descripción no puede superar los 500 caracteres.");

            RuleForEach(x => x.IdPermisos)
                .GreaterThan(0).WithMessage("Los IDs de permisos deben ser mayores a 0.");
        }
    }
}
