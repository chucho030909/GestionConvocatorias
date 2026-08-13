using GestionConvocatorias.Identity.Api.Data;
using GestionConvocatorias.Identity.Api.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

namespace GestionConvocatorias.Identity.Api.Services;

public class AlertaRetrasosService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly TimeSpan _intervalo = TimeSpan.FromHours(1);

    public AlertaRetrasosService(IServiceProvider serviceProvider)
    {
        _serviceProvider = serviceProvider;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            await VerificarProyectosRetrasados(stoppingToken);
            await Task.Delay(_intervalo, stoppingToken);
        }
    }

    private async Task VerificarProyectosRetrasados(CancellationToken cancellationToken)
    {
        using var scope = _serviceProvider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var proyectosRetrasados = await context.Proyectos
            .Where(p => p.Estado == EstadoProyecto.EnDesarrollo &&
                        p.FechaTermino != null &&
                        p.FechaTermino < DateTime.UtcNow)
            .ToListAsync(cancellationToken);

        foreach (var proyecto in proyectosRetrasados)
        {
            var integrantes = await context.ProyectoEstudiantes
                .Where(pe => pe.ProyectoId == proyecto.Id)
                .Select(pe => pe.UsuarioId)
                .ToListAsync(cancellationToken);

            foreach (var usuarioId in integrantes)
            {
                var notificacionExistente = await context.Notificaciones
                    .AnyAsync(n => n.UsuarioId == usuarioId &&
                                   n.Tipo == TipoNotificacion.Retraso &&
                                   n.Mensaje.Contains(proyecto.Titulo) &&
                                   n.FechaCreacion.Date == DateTime.UtcNow.Date,
                               cancellationToken);

                if (!notificacionExistente)
                {
                    var notificacion = new Notificacion
                    {
                        UsuarioId = usuarioId,
                        Mensaje = $"El proyecto \"{proyecto.Titulo}\" ha superado su fecha de término establecida.",
                        Tipo = TipoNotificacion.Retraso,
                        FechaCreacion = DateTime.UtcNow,
                        Leida = false
                    };

                    context.Notificaciones.Add(notificacion);
                }
            }
        }

        await context.SaveChangesAsync(cancellationToken);
    }
}
