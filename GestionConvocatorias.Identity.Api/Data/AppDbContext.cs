using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using GestionConvocatorias.Identity.Api.Models;

namespace GestionConvocatorias.Identity.Api.Data;

public class AppDbContext : IdentityDbContext<Usuario, IdentityRole<int>, int>
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<Usuario> Usuarios { get; set; }
    public DbSet<Convocatoria> Convocatorias { get; set; }
    public DbSet<Proyecto> Proyectos { get; set; }
    public DbSet<ProyectoEstudiante> ProyectoEstudiantes { get; set; }
    public DbSet<Documento> Documentos { get; set; }
    public DbSet<Evaluacion> Evaluaciones { get; set; }
    public DbSet<Comentario> Comentarios { get; set; }
    public DbSet<Avance> Avances { get; set; }
    public DbSet<Notificacion> Notificaciones { get; set; }
    public DbSet<EventoCalendario> EventosCalendario { get; set; }
    public DbSet<Mensaje> Mensajes { get; set; }
    public DbSet<InvitacionEvaluador> InvitacionesEvaluador { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<ProyectoEstudiante>()
            .HasOne(pe => pe.Proyecto)
            .WithMany(p => p.Integrantes)
            .HasForeignKey(pe => pe.ProyectoId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<ProyectoEstudiante>()
            .HasOne(pe => pe.Usuario)
            .WithMany()
            .HasForeignKey(pe => pe.UsuarioId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<ProyectoEstudiante>()
            .HasIndex(pe => new { pe.ProyectoId, pe.UsuarioId })
            .IsUnique();

        modelBuilder.Entity<Evaluacion>()
            .HasOne(e => e.Evaluador)
            .WithMany()
            .OnDelete(DeleteBehavior.NoAction);

        modelBuilder.Entity<Proyecto>()
            .HasOne(p => p.DocenteAsesor)
            .WithMany()
            .OnDelete(DeleteBehavior.NoAction);

        modelBuilder.Entity<Proyecto>()
            .HasOne(p => p.Evaluador)
            .WithMany()
            .OnDelete(DeleteBehavior.NoAction);

        modelBuilder.Entity<Comentario>()
            .HasOne(c => c.Usuario)
            .WithMany()
            .OnDelete(DeleteBehavior.NoAction);

        modelBuilder.Entity<Avance>()
            .HasOne(a => a.Usuario)
            .WithMany()
            .OnDelete(DeleteBehavior.NoAction);

        modelBuilder.Entity<Notificacion>()
            .HasOne(n => n.Usuario)
            .WithMany()
            .HasForeignKey(n => n.UsuarioId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Documento>()
            .HasOne(d => d.DocumentoPrevio)
            .WithMany()
            .HasForeignKey(d => d.DocumentoPrevioId)
            .OnDelete(DeleteBehavior.NoAction);

        modelBuilder.Entity<Mensaje>()
            .HasOne(m => m.Emisor)
            .WithMany()
            .HasForeignKey(m => m.EmisorId)
            .OnDelete(DeleteBehavior.NoAction);

        modelBuilder.Entity<Mensaje>()
            .HasOne(m => m.Receptor)
            .WithMany()
            .HasForeignKey(m => m.ReceptorId)
            .OnDelete(DeleteBehavior.NoAction);

        modelBuilder.Entity<Proyecto>()
            .Property(p => p.Estado)
            .HasConversion<string>();

        modelBuilder.Entity<InvitacionEvaluador>()
            .Property(i => i.Estado)
            .HasConversion<string>();

        modelBuilder.Entity<InvitacionEvaluador>()
            .HasIndex(i => i.Token)
            .IsUnique();
    }
}
