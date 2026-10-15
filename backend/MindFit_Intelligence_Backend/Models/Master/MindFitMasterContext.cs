using Microsoft.EntityFrameworkCore;
using MindFit_Intelligence_Backend.Models;

// 1. Le agregamos .Master al final del namespace para que coincida con la carpeta
namespace MindFit_Intelligence_Backend.Models.Master
{
    public class MindFitMasterContext : DbContext
    {
        public MindFitMasterContext(DbContextOptions<MindFitMasterContext> options)
            : base(options) { }

        public DbSet<Gym> Gyms { get; set; } = null!;
        public DbSet<GymPayPalSubscriptionHistorial> GymPayPalSubscriptionHistorial { get; set; } = null!;

        // Agregado: DbSets para la tabla de usuarios y personas responsables en la BD maestra
        public DbSet<UsuarioMaster> UsuarioMasters { get; set; } = null!;
        public DbSet<PersonaResponsableMaster> PersonasResponsablesMaster { get; set; } = null!;

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<Gym>(entity =>
            {
                entity.ToTable("Gym");
                entity.HasKey(x => x.IdGym);

                // 2. CORREGIDO: Copilot había puesto x.Nombre, pero tu propiedad es x.NombreGym
                entity.Property(x => x.NombreGym)
                    .IsRequired()
                    .HasMaxLength(150);

                entity.HasIndex(x => x.NombreGym)
                    .IsUnique();

                entity.Property(x => x.ConnectionString)
                    .IsRequired()
                    .HasMaxLength(500);

                entity.Property(x => x.Activo)
                    .HasDefaultValue(true);

                entity.Property(x => x.FechaCreacion)
                    .HasDefaultValueSql("GETUTCDATE()");

                entity.Property(x => x.PayPalSubscriptionId)
                    .HasColumnType("varchar(50)");

                entity.HasIndex(x => x.PayPalSubscriptionId)
                    .IsUnique()
                    .HasFilter("[PayPalSubscriptionId] IS NOT NULL");

                entity.Property(x => x.EstadoSuscripcionPayPal)
                    .HasColumnType("varchar(24)");

                entity.Property(x => x.FechaProximoPagoUtc)
                    .HasColumnType("datetime2");

                entity.Property(x => x.FechaEstadoSuscripcionUtc)
                    .HasColumnType("datetime2");

                entity.Property(x => x.FechaUltimaVerificacionPayPalUtc)
                    .HasColumnType("datetime2");

                entity.Property(x => x.FechaAccesoHastaUtc)
                    .HasColumnType("datetime2");

                entity.Property(x => x.AccesoBloqueadoPorSuscripcion)
                    .HasDefaultValue(false);

                entity.Property(x => x.FechaBloqueoSuscripcionUtc)
                    .HasColumnType("datetime2");

                entity.Property(x => x.PayPalPlanId)
                    .HasColumnType("varchar(50)");
            });

            modelBuilder.Entity<GymPayPalSubscriptionHistorial>(entity =>
            {
                entity.ToTable("GymPayPalSubscriptionHistorial");
                entity.HasKey(x => x.IdHistorial);

                entity.Property(x => x.PayPalSubscriptionId)
                    .IsRequired()
                    .HasColumnType("varchar(50)");

                entity.Property(x => x.PayPalPlanId)
                    .HasColumnType("varchar(50)");

                entity.Property(x => x.EstadoPayPal)
                    .HasColumnType("varchar(24)");

                entity.Property(x => x.FechaInicioUtc)
                    .HasColumnType("datetime2");

                entity.Property(x => x.FechaFinAccesoUtc)
                    .HasColumnType("datetime2");

                entity.Property(x => x.FechaReemplazoUtc)
                    .HasColumnType("datetime2");

                entity.Property(x => x.Motivo)
                    .IsRequired()
                    .HasColumnType("varchar(60)");

                entity.Property(x => x.FechaRegistroUtc)
                    .HasColumnType("datetime2")
                    .HasDefaultValueSql("GETUTCDATE()");

                entity.HasIndex(x => x.IdGym);
                entity.HasIndex(x => x.PayPalSubscriptionId);

                entity.HasOne(x => x.Gym)
                    .WithMany()
                    .HasForeignKey(x => x.IdGym)
                    .OnDelete(DeleteBehavior.NoAction);
            });

            // Mapeo para UsuarioMaster
            modelBuilder.Entity<UsuarioMaster>(entity =>
            {
                entity.ToTable("UsuarioMaster");
                entity.HasKey(x => x.IdUsuarioMaster);

                entity.Property(x => x.Username)
                    .HasColumnType("varchar(50)")
                    .IsRequired();

                entity.Property(x => x.PasswordHash)
                    .HasColumnType("varchar(255)")
                    .IsRequired();

                entity.Property(x => x.RefreshToken)
                    .HasColumnType("varchar(512)");

                entity.Property(x => x.RefreshTokenExpiryTime)
                    .HasColumnType("datetime2");

                entity.Property(x => x.FechaRegistro)
                    .HasColumnType("date");

                entity.HasOne(u => u.Gym)
                     .WithMany() // Gym no necesita tener la lista de usuarios maestros
                     .HasForeignKey(u => u.IdGym)
                     .OnDelete(DeleteBehavior.Cascade); // Si borrás el Gym, se borra la solicitud del dueño
            });

            // Mapeo para PersonaResponsableMaster (PK compartida con UsuarioMaster)
            modelBuilder.Entity<PersonaResponsableMaster>(entity =>
            {
                entity.ToTable("PersonaResponsableMaster");
                entity.HasKey(x => x.IdUsuarioMaster);

                entity.Property(x => x.Nombre).HasColumnType("varchar(50)");
                entity.Property(x => x.Apellido).HasColumnType("varchar(50)");
                entity.Property(x => x.Email).HasColumnType("varchar(50)");
                entity.Property(x => x.Telefono).HasColumnType("varchar(20)");
                entity.Property(x => x.Direccion).HasColumnType("varchar(50)");
                entity.Property(x => x.Ciudad).HasColumnType("varchar(50)");
                entity.Property(x => x.TipoDocumento).HasColumnType("varchar(50)");
                entity.Property(x => x.NroDocumento).HasColumnType("varchar(20)");
                entity.Property(x => x.Genero).HasColumnType("varchar(20)");
                entity.Property(x => x.FechaNacimiento).HasColumnType("date");

                // Configuramos la relación one-to-one con UsuarioMaster usando la PK compartida
                entity.HasOne(p => p.UsuarioMaster)
                      .WithOne(u => u.PersonaResponsableMaster)
                      .HasForeignKey<PersonaResponsableMaster>(p => p.IdUsuarioMaster)
                      .OnDelete(DeleteBehavior.Cascade);
            });
        }
    }
}
