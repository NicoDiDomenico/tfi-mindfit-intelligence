using Microsoft.EntityFrameworkCore;

namespace MindFit_Intelligence_Backend.Models
{
    public class MindFitIntelligenceContext : DbContext
    {
        public MindFitIntelligenceContext(DbContextOptions<MindFitIntelligenceContext> options)
            : base(options) { }

        public DbSet<PersonaResponsable> PersonaResponsables { get; set; } = null!;
        public DbSet<Usuario> Usuarios { get; set; } = null!;
        public DbSet<PersonaSocio> PersonaSocios { get; set; } = null!;
        public DbSet<Grupo> Grupos { get; set; } = null!;
        public DbSet<Permiso> Permisos { get; set; } = null!;
        public DbSet<Formulario> Formularios { get; set; } = null!;
        public DbSet<UsuarioGrupo> UsuarioGrupos { get; set; } = null!;
        public DbSet<GrupoPermiso> GrupoPermisos { get; set; } = null!;
        public DbSet<FormularioPermiso> FormularioPermisos { get; set; } = null!;
        public DbSet<Rutina> Rutinas { get; set; } = null!;
        public DbSet<Dia> Dias { get; set; } = null!;
        public DbSet<PerfilIA> PerfilesIA { get; set; } = null!;
        public DbSet<Cuota> Cuotas { get; set; } = null!;
        public DbSet<Turno> Turnos { get; set; } = null!;
        public DbSet<CupoFecha> CupoFechas { get; set; } = null!;
        public DbSet<RangoHorario> RangosHorarios { get; set; } = null!;
        public DbSet<DiaRangoHorario> DiaRangosHorarios { get; set; } = null!;
        public DbSet<DiaRangoHorarioResponsable> DiaRangosHorariosResponsables { get; set; } = null!;
        public DbSet<GrupoMuscular> GruposMusculares { get; set; } = null!;
        public DbSet<TipoEjercicio> TiposEjercicios { get; set; } = null!;
        public DbSet<Ejercicio> Ejercicios { get; set; } = null!;
        public DbSet<Maquina> Maquinas { get; set; } = null!;
        public DbSet<Equipamiento> Equipamientos { get; set; } = null!;
        public DbSet<Calentamiento> Calentamientos { get; set; } = null!;
        public DbSet<Entrenamiento> Entrenamientos { get; set; } = null!;
        public DbSet<Estiramiento> Estiramientos { get; set; } = null!;
        public DbSet<RutinaHistorial> RutinasHistorial { get; set; } = null!;
        public DbSet<RutinaHistorialCalentamiento> RutinasHistorialCalentamientos { get; set; } = null!;
        public DbSet<RutinaHistorialEntrenamiento> RutinasHistorialEntrenamientos { get; set; } = null!;
        public DbSet<RutinaHistorialEstiramiento> RutinasHistorialEstiramientos { get; set; } = null!;
        public DbSet<AuditoriaEvento> AuditoriaEventos { get; set; } = null!;
        public DbSet<AuditoriaSesion> AuditoriaSesiones { get; set; } = null!;

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            /*
            - Regla de lo que coloco en el OnModelCreating:
                1. Configuraciones de tablas (ToTable)
                2. Relaciones (HasOne, WithOne, HasMany, WithMany, HasForeignKey)
            - El resto de las configuraciones (como índices, restricciones, etc) lo coloco en las clases de cada entidad usando Data Annotations.
             */
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<PersonaResponsable>().ToTable("PersonaResponsable");
            modelBuilder.Entity<Usuario>().ToTable("Usuario");
            modelBuilder.Entity<PersonaSocio>().ToTable("PersonaSocio");
            modelBuilder.Entity<Grupo>().ToTable("Grupo");
            modelBuilder.Entity<Permiso>().ToTable("Permiso");
            modelBuilder.Entity<Formulario>().ToTable("Formulario");
            modelBuilder.Entity<UsuarioGrupo>().ToTable("UsuarioGrupo");
            modelBuilder.Entity<GrupoPermiso>().ToTable("GrupoPermiso");
            modelBuilder.Entity<FormularioPermiso>().ToTable("FormularioPermiso");
            modelBuilder.Entity<Rutina>().ToTable("Rutina");
            modelBuilder.Entity<Dia>().ToTable("Dia");
            modelBuilder.Entity<PerfilIA>().ToTable("PerfilIA");
            modelBuilder.Entity<Cuota>().ToTable("Cuota");
            modelBuilder.Entity<Turno>().ToTable("Turno");
            modelBuilder.Entity<CupoFecha>().ToTable("CupoFecha");
            modelBuilder.Entity<RangoHorario>().ToTable("RangoHorario");
            modelBuilder.Entity<DiaRangoHorario>().ToTable("DiaRangoHorario");
            modelBuilder.Entity<DiaRangoHorarioResponsable>().ToTable("DiaRangoHorarioResponsable");
            modelBuilder.Entity<GrupoMuscular>().ToTable("GrupoMuscular");
            modelBuilder.Entity<TipoEjercicio>().ToTable("TipoEjercicio");
            modelBuilder.Entity<Ejercicio>().ToTable("Ejercicio");
            modelBuilder.Entity<Maquina>().ToTable("Maquina");
            modelBuilder.Entity<Equipamiento>().ToTable("Equipamiento");
            modelBuilder.Entity<Calentamiento>().ToTable("Calentamiento");
            modelBuilder.Entity<Entrenamiento>().ToTable("Entrenamiento");
            modelBuilder.Entity<Estiramiento>().ToTable("Estiramiento");
            modelBuilder.Entity<RutinaHistorial>().ToTable("RutinaHistorial");
            modelBuilder.Entity<RutinaHistorialCalentamiento>().ToTable("RutinaHistorialCalentamiento");
            modelBuilder.Entity<RutinaHistorialEntrenamiento>().ToTable("RutinaHistorialEntrenamiento");
            modelBuilder.Entity<RutinaHistorialEstiramiento>().ToTable("RutinaHistorialEstiramiento");
            modelBuilder.Entity<AuditoriaEvento>().ToTable("AuditoriaEvento");
            modelBuilder.Entity<AuditoriaSesion>().ToTable("AuditoriaSesion");

            //// Relacio 1 a 1 PK compartida
            // 1 a 1 PK compartida Usuario <-> PersonaResponsable
            modelBuilder.Entity<Usuario>()
                .HasOne(u => u.PersonaResponsable)
                .WithOne(pr => pr.Usuario)
                .HasForeignKey<PersonaResponsable>(pr => pr.IdUsuario)
                .OnDelete(DeleteBehavior.Cascade);

            // 1 a 1 PK compartida Usuario <-> PersonaSocio
            modelBuilder.Entity<Usuario>()
                .HasOne(u => u.PersonaSocio)
                .WithOne(ps => ps.Usuario)
                .HasForeignKey<PersonaSocio>(ps => ps.IdUsuario)
                .OnDelete(DeleteBehavior.Cascade);

            //// Modulo de Seguridad (N:M)
            // Relaciones UsuarioGrupo
            modelBuilder.Entity<UsuarioGrupo>()
                .HasOne(ug => ug.Usuario)
                .WithMany(u => u.UsuarioGrupos)
                .HasForeignKey(ug => ug.IdUsuario)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<UsuarioGrupo>()
                .HasOne(ug => ug.Grupo)
                .WithMany(g => g.UsuarioGrupos)
                .HasForeignKey(ug => ug.IdGrupo)
                .OnDelete(DeleteBehavior.Restrict);

            // Relaciones GrupoPermiso
            modelBuilder.Entity<GrupoPermiso>()
                .HasOne(gp => gp.Grupo)
                .WithMany(g => g.GrupoPermisos)
                .HasForeignKey(gp => gp.IdGrupo)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<GrupoPermiso>()
                .HasOne(gp => gp.Permiso)
                .WithMany(p => p.GrupoPermisos)
                .HasForeignKey(gp => gp.IdPermiso);

            // Relaciones FormularioPermiso
            modelBuilder.Entity<FormularioPermiso>()
                .HasOne(fp => fp.Formulario)
                .WithMany(f => f.FormularioPermisos)
                .HasForeignKey(fp => fp.IdFormulario)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<FormularioPermiso>()
                .HasOne(fp => fp.Permiso)
                .WithMany(p => p.FormularioPermisos)
                .HasForeignKey(fp => fp.IdPermiso);

            // Relaciones Rutina - PersonaSocio (N:1)
            modelBuilder.Entity<Rutina>()
                .HasOne(r => r.PersonaSocio)
                .WithMany(ps => ps.Rutinas)
                .HasForeignKey(r => r.IdPersonaSocio)
                .OnDelete(DeleteBehavior.Cascade); // Si se borra un socio, se borran sus rutinas

            // Relacion Rutina - Dia (N:1)
            modelBuilder.Entity<Rutina>()
                .HasOne(r => r.Dia)
                .WithMany(d => d.Rutinas)
                .HasForeignKey(r => r.IdDia);

            // Relacion Cuota - PersonaSocio (N:1)
            modelBuilder.Entity<Cuota>()
                .HasOne(c => c.PersonaSocio)
                .WithMany(ps => ps.Cuotas)
                .HasForeignKey(c => c.IdUsuario)
                .OnDelete(DeleteBehavior.Cascade); // Si se borra un socio, se borran sus cuotas

            //Configurando Enums para que se guarden como Strings en la BD (en vez de enteros)
            modelBuilder.Entity<PersonaResponsable>()
                .Property(p => p.Genero)
                .HasConversion<string>();

            modelBuilder.Entity<PersonaSocio>()
                .Property(p => p.EstadoSocio)
                .HasConversion<string>();

            modelBuilder.Entity<PersonaSocio>()
                .Property(p => p.Genero)
                .HasConversion<string>();

            modelBuilder.Entity<Cuota>()
                .Property(c => c.Plan)
                .HasConversion<string>();

            modelBuilder.Entity<Cuota>()
                .Property(c => c.EstadoCuota)
                .HasConversion<string>();

            modelBuilder.Entity<Turno>()
                .Property(t => t.EstadoTurno)
                .HasConversion<string>();

            // Configurando índice único para evitar que un mismo socio tenga más de una rutina para el mismo día
            // COLOCAR FLUENT VALIDADATION EN EL DTO DE RUTINA PARA VALIDAR QUE NO SE REPITA EL DIA EN LAS RUTINAS QUE ME LLEGAN EN EL DTO DE PERSONA SOCIO
            modelBuilder.Entity<Rutina>()
                .HasIndex(r => new { r.IdPersonaSocio, r.IdDia })
                .IsUnique();

            modelBuilder.Entity<PerfilIA>()
                .HasOne(p => p.PersonaSocio)
                .WithOne(ps => ps.PerfilIA)
                .HasForeignKey<PerfilIA>(p => p.IdUsuario)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Turno>()
                .HasOne(t => t.PersonaResponsable)
                .WithMany(pr => pr.Turnos)
                .HasForeignKey(t => t.IdUsuarioResponsable)
                .OnDelete(DeleteBehavior.Restrict); // Si se borra un responsable, no se borran los turnos (se podría poner en null el IdUsuarioResponsable)

            modelBuilder.Entity<Turno>()
                .HasOne(t => t.PersonaSocio)
                .WithMany(ps => ps.Turnos)
                .HasForeignKey(t => t.IdUsuarioSocio)
                .OnDelete(DeleteBehavior.Cascade); // Si se borra un socio, se borran sus turnos

            modelBuilder.Entity<Turno>()
                .HasOne(t => t.CupoFecha)
                .WithMany(cf => cf.Turnos)
                .HasForeignKey(t => t.IdCupoFecha)
                .OnDelete(DeleteBehavior.Restrict); // Si se borra un cupo fecha, no se borran los turnos (se podría poner en null el IdCupoFecha)

            modelBuilder.Entity<DiaRangoHorario>()
                .HasOne(drh => drh.Dia)
                .WithMany(d => d.DiaRangosHorarios)
                .HasForeignKey(drh => drh.IdDia)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<DiaRangoHorario>()
                .HasOne(drh => drh.RangoHorario)
                .WithMany(rh => rh.DiaRangosHorarios)
                .HasForeignKey(drh => drh.IdRangoHorario)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<CupoFecha>()
                .HasOne(cf => cf.DiaRangoHorario)
                .WithMany(drh => drh.CupoFechas)
                .HasForeignKey(cf => cf.IdDiaRangoHorario)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<DiaRangoHorarioResponsable>()
                .HasOne(drhr => drhr.PersonaResponsable)
                .WithMany(pr => pr.DiaRangoHorarioResponsables)
                .HasForeignKey(drhr => drhr.IdUsuarioResponsable)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<DiaRangoHorarioResponsable>()
                .HasOne(drhr => drhr.DiaRangoHorario)
                .WithMany(drh => drh.DiaRangoHorarioResponsables)
                .HasForeignKey(drhr => drhr.IdDiaRangoHorario)
                .OnDelete(DeleteBehavior.Cascade);

            // Configurando Enums para que se guarden como Strings en la BD (en vez de enteros)
            modelBuilder.Entity<TipoEjercicio>()
                .Property(t => t.NombreTipo)
                .HasConversion<string>();

            modelBuilder.Entity<GrupoMuscular>()
                .Property(t => t.NombreMusculo)
                .HasConversion<string>();

            // Relaciones de Ejercicio (Catálogo)
            modelBuilder.Entity<Ejercicio>()
                .HasOne(e => e.GrupoMuscular)
                .WithMany(gm => gm.Ejercicios)
                .HasForeignKey(e => e.IdGrupoMuscular)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Ejercicio>()
                .HasOne(e => e.TipoEjercicio)
                .WithMany(te => te.Ejercicios)
                .HasForeignKey(e => e.IdTipoEjercicio)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Ejercicio>()
                .HasOne(e => e.Maquina)
                .WithMany() // Una máquina puede estar en varios ejercicios (ej: multipower)
                .HasForeignKey(e => e.IdMaquina)
                .OnDelete(DeleteBehavior.SetNull);

            modelBuilder.Entity<Ejercicio>()
                .HasOne(e => e.Equipamiento)
                .WithMany()
                .HasForeignKey(e => e.IdEquipamiento)
                .OnDelete(DeleteBehavior.SetNull);

            // Relaciones de Instancias de Rutina (Calentamiento, Entrenamiento, Estiramiento)

            // CALENTAMIENTO
            modelBuilder.Entity<Calentamiento>()
                .HasOne(c => c.Rutina)
                .WithMany(r => r.Calentamientos)
                .HasForeignKey(c => c.IdRutina)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Calentamiento>()
                .HasOne(c => c.Ejercicio)
                .WithMany()
                .HasForeignKey(c => c.IdEjercicio);

            // ENTRENAMIENTO
            modelBuilder.Entity<Entrenamiento>()
                .HasOne(en => en.Rutina)
                .WithMany(r => r.Entrenamientos)
                .HasForeignKey(en => en.IdRutina)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Entrenamiento>()
                .HasOne(en => en.Ejercicio)
                .WithMany()
                .HasForeignKey(en => en.IdEjercicio);

            // ESTIRAMIENTO
            modelBuilder.Entity<Estiramiento>()
                .HasOne(es => es.Rutina)
                .WithMany(r => r.Estiramientos)
                .HasForeignKey(es => es.IdRutina)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Estiramiento>()
                .HasOne(es => es.Ejercicio)
                .WithMany()
                .HasForeignKey(es => es.IdEjercicio);

            // Historial de Rutina
            modelBuilder.Entity<RutinaHistorial>()
                .HasOne(h => h.Rutina)
                .WithMany(r => r.Historiales)
                .HasForeignKey(h => h.IdRutina)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<RutinaHistorial>()
                .HasIndex(h => new { h.IdRutina, h.Version })
                .IsUnique();

            modelBuilder.Entity<RutinaHistorialCalentamiento>()
                .HasOne(c => c.RutinaHistorial)
                .WithMany(h => h.Calentamientos)
                .HasForeignKey(c => c.IdRutinaHistorial)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<RutinaHistorialEntrenamiento>()
                .HasOne(e => e.RutinaHistorial)
                .WithMany(h => h.Entrenamientos)
                .HasForeignKey(e => e.IdRutinaHistorial)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<RutinaHistorialEstiramiento>()
                .HasOne(e => e.RutinaHistorial)
                .WithMany(h => h.Estiramientos)
                .HasForeignKey(e => e.IdRutinaHistorial)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
