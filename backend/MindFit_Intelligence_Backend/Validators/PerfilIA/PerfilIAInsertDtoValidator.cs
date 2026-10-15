using FluentValidation;
using MindFit_Intelligence_Backend.DTOs.PerfilIA;

namespace MindFit_Intelligence_Backend.Validators.PerfilIA
{
    public class PerfilIAInsertDtoValidator : AbstractValidator<PerfilIAInsertDto>
    {
        public PerfilIAInsertDtoValidator()
        {
            RuleFor(x => x.ObjetivoPrincipal)
                .MaximumLength(500).WithMessage("El objetivo principal no puede superar los 500 caracteres.");

            RuleFor(x => x.NivelExperiencia)
                .MaximumLength(500).WithMessage("El nivel de experiencia no puede superar los 500 caracteres.");

            RuleFor(x => x.EjerciciosPreferidos)
                .MaximumLength(500).WithMessage("Los ejercicios preferidos no pueden superar los 500 caracteres.");

            RuleFor(x => x.EjerciciosAEvitar)
                .MaximumLength(500).WithMessage("Los ejercicios a evitar no pueden superar los 500 caracteres.");

            RuleFor(x => x.DisponibilidadHoraria)
                .MaximumLength(500).WithMessage("La disponibilidad horaria no puede superar los 500 caracteres.");

            RuleFor(x => x.MotivacionPersonal)
                .MaximumLength(500).WithMessage("La motivacion personal no puede superar los 500 caracteres.");

            RuleFor(x => x.LesionesLimitaciones)
                .MaximumLength(500).WithMessage("Las lesiones o limitaciones no pueden superar los 500 caracteres.");

            RuleFor(x => x.CondicionesMedicasRelevantes)
                .MaximumLength(500).WithMessage("Las condiciones medicas relevantes no pueden superar los 500 caracteres.");

            RuleFor(x => x.IntensidadPreferida)
                .MaximumLength(100).WithMessage("La intensidad preferida no puede superar los 100 caracteres.");

            RuleFor(x => x.DuracionSesionMinutos)
                .GreaterThan(0).WithMessage("La duracion de sesion debe ser mayor a 0 minutos.")
                .When(x => x.DuracionSesionMinutos.HasValue);

            RuleFor(x => x.NotasEntrenador)
                .MaximumLength(500).WithMessage("Las notas del entrenador no pueden superar los 500 caracteres.");

            RuleFor(x => x.PlanAlimenticio)
                .MaximumLength(8000).WithMessage("El plan alimenticio no puede superar los 8000 caracteres.");
        }
    }
}
