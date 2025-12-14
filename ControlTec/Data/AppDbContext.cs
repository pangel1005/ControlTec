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




        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Solicitud 1-N DocumentosCargados
            modelBuilder.Entity<Solicitud>()
                .HasMany(s => s.DocumentosCargados)
                .WithOne(d => d.Solicitud)
                .HasForeignKey(d => d.SolicitudId);

            // Servicio 1-N DocumentosRequeridos
            modelBuilder.Entity<Servicio>()
                .HasMany(s => s.DocumentosRequeridos)
                .WithOne(d => d.Servicio)
                .HasForeignKey(d => d.ServicioId);

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
                      .WithMany() // si luego quieres lista de movimientos en Usuario, aquí se cambia
                      .HasForeignKey(h => h.UsuarioId)
                      .OnDelete(DeleteBehavior.Restrict);
            });
        }
    }
}
