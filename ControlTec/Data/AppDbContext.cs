using ControlTec.Models;
using Microsoft.EntityFrameworkCore;

namespace ControlTec.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        // Tablas
        public DbSet<Usuario> Usuarios { get; set; } = null!;
        public DbSet<Servicio> Servicios { get; set; } = null!;
        public DbSet<Solicitud> Solicitudes { get; set; } = null!;
        public DbSet<Documento> Documentos { get; set; } = null!;
        public DbSet<DocumentoRequerido> DocumentosRequeridos { get; set; } = null!;
        public DbSet<HistorialEstado> HistorialEstados { get; set; } = null!;
        public DbSet<Subservicio> Subservicios { get; set; } = null!;
        public DbSet<FormularioDigital> FormulariosDigitales { get; set; } = null!;
        public DbSet<RespuestaFormularioDigital> RespuestasFormulariosDigitales { get; set; } = null!;
        public DbSet<TwoFactorCode> TwoFactorCodes { get; set; } = null!;

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // ✅ TwoFactorCodes

            modelBuilder.Entity<TwoFactorCode>(entity =>
            {
                entity.HasKey(x => x.Id);

                entity.HasIndex(x => x.SessionToken).IsUnique();

                entity.HasOne(x => x.Usuario)
                      .WithMany()
                      .HasForeignKey(x => x.UsuarioId)
                      .OnDelete(DeleteBehavior.Cascade);

                entity.Property(x => x.CodigoHash).HasMaxLength(64).IsRequired();
                entity.Property(x => x.SessionToken).HasMaxLength(64).IsRequired();
            });

            // ===============================
            // 🔐 CONFIRMACIÓN DE CORREO (Usuario)
            // ===============================
            modelBuilder.Entity<Usuario>(entity =>
            {
                entity.Property(u => u.EmailConfirmado)
                      .HasDefaultValue(false);

                entity.Property(u => u.EmailConfirmacionToken)
                      .HasMaxLength(200);

                entity.Property(u => u.EmailConfirmacionExpira)
                      .HasColumnType("datetime2");

                entity.Property(u => u.FechaEmailConfirmado)
                      .HasColumnType("datetime2");
            });

            // Solicitud 1-N DocumentosCargados
            modelBuilder.Entity<Solicitud>()
                .HasMany(s => s.DocumentosCargados)
                .WithOne(d => d.Solicitud)
                .HasForeignKey(d => d.SolicitudId)
                .OnDelete(DeleteBehavior.Cascade);

            // Servicio 1-N DocumentosRequeridos
            modelBuilder.Entity<Servicio>()
                .HasMany(s => s.DocumentosRequeridos)
                .WithOne(d => d.Servicio)
                .HasForeignKey(d => d.ServicioId)
                .OnDelete(DeleteBehavior.Cascade);

            // HistorialEstados
            modelBuilder.Entity<HistorialEstado>(entity =>
            {
                entity.HasKey(h => h.Id);

                entity.Property(h => h.EstadoNuevo)
                      .IsRequired()
                      .HasMaxLength(50);

                entity.Property(h => h.EstadoAnterior)
                      .HasMaxLength(50);

                entity.Property(h => h.Comentario)
                      .HasMaxLength(500);

                entity.Property(h => h.FechaCambio)
                      .HasColumnType("datetime2");

                entity.HasOne(h => h.Solicitud)
                      .WithMany(s => s.HistorialEstados)
                      .HasForeignKey(h => h.SolicitudId)
                      .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(h => h.Usuario)
                      .WithMany()
                      .HasForeignKey(h => h.UsuarioId)
                      .OnDelete(DeleteBehavior.Restrict);
            });

            // ✅ FIX: RespuestaFormularioDigital (evita multiple cascade paths)
            modelBuilder.Entity<RespuestaFormularioDigital>(entity =>
            {
                entity.HasKey(r => r.Id);

                // 🚫 QUITAR CASCADE desde Solicitudes
                entity.HasOne(r => r.Solicitud)
                      .WithMany()
                      .HasForeignKey(r => r.SolicitudId)
                      .OnDelete(DeleteBehavior.NoAction);

                // ✅ CASCADE hacia FormularioDigital (está bien así)
                entity.HasOne(r => r.FormularioDigital)
                      .WithMany()
                      .HasForeignKey(r => r.FormularioDigitalId)
                      .OnDelete(DeleteBehavior.Cascade);
            });
        }
    }
}
