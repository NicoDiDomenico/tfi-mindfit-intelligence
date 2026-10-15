using FluentValidation;
using MindFit_Intelligence_Backend.DTOs.Ejercicios;

namespace MindFit_Intelligence_Backend.Validators.Ejercicios
{
    public class EjercicioInsertDtoValidator : AbstractValidator<EjercicioInsertDto>
    {
        public EjercicioInsertDtoValidator()
        {
            RuleFor(x => x.DescEjercicio)
                .NotEmpty().WithMessage("La descripción del ejercicio es obligatoria.")
                .MaximumLength(200).WithMessage("La descripción del ejercicio no puede superar los 200 caracteres.");

            RuleFor(x => x.IdGrupoMuscular)
                .GreaterThan(0).WithMessage("El Grupo Muscular es obligatorio.");

            RuleFor(x => x.IdTipoEjercicio)
                .GreaterThan(0).WithMessage("El Tipo de Ejercicio es obligatorio.");

            RuleFor(x => x.IdMaquina)
                .GreaterThan(0).When(x => x.IdMaquina.HasValue)
                .WithMessage("El Id de Máquina debe ser mayor a 0.");

            RuleFor(x => x.IdEquipamiento)
                .GreaterThan(0).When(x => x.IdEquipamiento.HasValue)
                .WithMessage("El Id de Equipamiento debe ser mayor a 0.");
        }
    }
}
