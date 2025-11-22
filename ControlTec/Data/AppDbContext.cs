using Microsoft.EntityFrameworkCore;
using ControlTec.Models;

namespace ControlTec.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<Usuario> Usuarios { get; set; }
        public DbSet<Servicio> Servicios { get; set; }
        public DbSet<Solicitud> Solicitudes { get; set; }
        public DbSet<Documento> Documentos { get; set; }
        public DbSet<DocumentoRequerido> DocumentosRequeridos { get; set; }
        public DbSet<HistorialEstado> HistorialEstados { get; set; }


        // Configuración de las relaciones entre las entidades
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Solicitud>()
                .HasMany(s => s.DocumentosCargados)
                .WithOne(d => d.Solicitud)
                .HasForeignKey(d => d.SolicitudId);

            modelBuilder.Entity<Servicio>()
                .HasMany(s => s.DocumentosRequeridos)
                .WithOne(d => d.Servicio)
                .HasForeignKey(d => d.ServicioId);
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
                      .WithMany() // si luego quieres una colección, la agregas en Usuario
                      .HasForeignKey(h => h.UsuarioId)
                      .OnDelete(DeleteBehavior.Restrict);
            });


        }
    }
}
