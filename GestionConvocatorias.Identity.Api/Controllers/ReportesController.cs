using GestionConvocatorias.Identity.Api.Data;
using GestionConvocatorias.Identity.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace GestionConvocatorias.Identity.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Coordinador,Administrador")]
public class ReportesController : ControllerBase
{
    private readonly AppDbContext _context;

    public ReportesController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet("dashboard")]
    public async Task<IActionResult> GetDashboardData()
    {
        var totalProyectos = await _context.Proyectos.CountAsync();

        var totalEvaluaciones = await _context.Evaluaciones.CountAsync();

        var proyectosPorCategoria = await _context.Proyectos
            .GroupBy(p => p.Categoria)
            .Select(g => new
            {
                categoria = g.Key,
                total = g.Count()
            })
            .OrderByDescending(x => x.total)
            .ToListAsync();

        var proyectosPorEstado = await _context.Proyectos
            .GroupBy(p => p.Estado)
            .Select(g => new
            {
                estado = g.Key.ToString(),
                total = g.Count()
            })
            .ToListAsync();

        var convocatoriasActivas = await _context.Convocatorias
            .CountAsync(c => c.Estado == "Activa");

        var datos = new
        {
            totalProyectos,
            totalEvaluaciones,
            convocatoriasActivas,
            proyectosPorCategoria,
            proyectosPorEstado
        };

        return Ok(datos);
    }

    [HttpGet("ranking/{convocatoriaId}")]
    public async Task<IActionResult> Ranking(int convocatoriaId)
    {
        var proyectos = await _context.Proyectos
            .Include(p => p.Integrantes)
                .ThenInclude(pe => pe.Usuario)
            .Include(p => p.Evaluaciones)
            .Where(p => p.ConvocatoriaId == convocatoriaId)
            .ToListAsync();

        var ranking = proyectos
            .Select(p => new
            {
                p.Id,
                p.Titulo,
                p.Categoria,
                Estado = p.Estado.ToString(),
                Integrantes = p.Integrantes?
                    .Select(pe => pe.Usuario)
                    .Where(u => u != null)
                    .Select(u => $"{u!.Nombres} {u.Apellidos}")
                    .ToList(),
                TotalEvaluaciones = p.Evaluaciones?.Count ?? 0,
                PromedioPuntaje = p.Evaluaciones != null && p.Evaluaciones.Any()
                    ? Math.Round(p.Evaluaciones.Average(e => e.PuntajeTotal), 2)
                    : 0m
            })
            .OrderByDescending(x => x.PromedioPuntaje)
            .ToList();

        return Ok(ranking);
    }

    [HttpGet("historico")]
    public async Task<IActionResult> Historico([FromQuery] DateTime? fechaInicio, [FromQuery] DateTime? fechaFin, [FromQuery] string? categoria)
    {
        IQueryable<Proyecto> query = _context.Proyectos
            .Include(p => p.Convocatoria)
            .Include(p => p.Integrantes)
                .ThenInclude(pe => pe.Usuario);

        if (!string.IsNullOrWhiteSpace(categoria))
            query = query.Where(p => p.Categoria == categoria);

        if (fechaInicio.HasValue)
            query = query.Where(p => p.Convocatoria != null && p.Convocatoria.FechaApertura >= fechaInicio.Value);

        if (fechaFin.HasValue)
        {
            var fechaFinMax = fechaFin.Value.AddDays(1);
            query = query.Where(p => p.Convocatoria != null && p.Convocatoria.FechaApertura < fechaFinMax);
        }

        var proyectos = await query.ToListAsync();

        var evaluaciones = await _context.Evaluaciones
            .Where(e => proyectos.Select(p => p.Id).Contains(e.ProyectoId))
            .ToListAsync();

        var resultado = proyectos.Select(p =>
        {
            var evals = evaluaciones.Where(e => e.ProyectoId == p.Id).ToList();
            var integrantes = p.Integrantes?.Select(pe => pe.Usuario).ToList();
            return new
            {
                p.Id,
                p.Titulo,
                p.Categoria,
                Estado = p.Estado.ToString(),
                Cuatrimestre = p.Convocatoria != null ? ObtenerCuatrimestre(p.Convocatoria.FechaApertura) : null,
                Convocatoria = p.Convocatoria?.Titulo,
                Integrantes = integrantes?.Select(u => u != null ? $"{u.Nombres} {u.Apellidos}" : null).ToList(),
                Evaluaciones = evals.Select(e => new
                {
                    e.Id,
                    e.CalificacionInnovacion,
                    e.CalificacionViabilidad,
                    e.CalificacionImpactoSocial,
                    e.CalificacionSustentabilidad,
                    e.CalificacionModeloNegocio,
                    e.PuntajeTotal,
                    e.ObservacionesGenerales,
                    e.FechaEvaluacion
                }).ToList(),
                PromedioPuntaje = evals.Any()
                    ? Math.Round(evals.Average(e => e.PuntajeTotal), 2)
                    : 0m
            };
        }).ToList();

        return Ok(resultado);
    }

    [HttpGet("exportar/{proyectoId}")]
    public async Task<IActionResult> Exportar(int proyectoId)
    {
        var proyecto = await _context.Proyectos
            .Include(p => p.Convocatoria)
            .Include(p => p.Integrantes)
                .ThenInclude(pe => pe.Usuario)
            .FirstOrDefaultAsync(p => p.Id == proyectoId);

        if (proyecto is null)
            return NotFound(new { mensaje = "El proyecto no existe." });

        var documentos = await _context.Documentos
            .Where(d => d.ProyectoId == proyectoId)
            .ToListAsync();

        var evaluaciones = await _context.Evaluaciones
            .Include(e => e.Evaluador)
            .Where(e => e.ProyectoId == proyectoId)
            .ToListAsync();

        var integrantes = proyecto.Integrantes?.Select(pe => pe.Usuario).ToList();

        var resumen = new
        {
            Proyecto = new
            {
                proyecto.Id,
                proyecto.Titulo,
                proyecto.Categoria,
                proyecto.Resumen,
                proyecto.VideoUrl,
                Estado = proyecto.Estado.ToString(),
                Cuatrimestre = proyecto.Convocatoria != null ? ObtenerCuatrimestre(proyecto.Convocatoria.FechaApertura) : null,
                Convocatoria = proyecto.Convocatoria?.Titulo
            },
            Equipo = integrantes?.Select(u => u != null ? new
            {
                u.Id,
                NombreCompleto = $"{u.Nombres} {u.Apellidos}",
                Correo = u.Email
            } : null).ToList(),
            Documentos = documentos.Select(d => new
            {
                d.Id,
                d.NombreArchivo,
                d.RutaUbicacion,
                d.Tipo,
                d.FechaSubida
            }).ToList(),
            Calificaciones = evaluaciones.Select(e => new
            {
                e.Id,
                Evaluador = e.Evaluador != null ? $"{e.Evaluador.Nombres} {e.Evaluador.Apellidos}" : null,
                e.CalificacionInnovacion,
                e.CalificacionViabilidad,
                e.CalificacionImpactoSocial,
                e.CalificacionSustentabilidad,
                e.CalificacionModeloNegocio,
                e.PuntajeTotal,
                e.ObservacionesGenerales,
                e.FechaEvaluacion
            }).ToList(),
            PuntajeFinal = evaluaciones.Any()
                ? Math.Round(evaluaciones.Average(e => e.PuntajeTotal), 2)
                : 0m
        };

        return Ok(resumen);
    }

    private static string ObtenerCuatrimestre(DateTime fecha)
    {
        var periodo = ((fecha.Month - 1) / 4) + 1;
        return $"{fecha.Year}-C{periodo}";
    }
}
