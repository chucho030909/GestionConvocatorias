using GestionConvocatorias.Identity.Api.Data;
using GestionConvocatorias.Identity.Api.DTOs.Proyectos;
using GestionConvocatorias.Identity.Api.Models;
using GestionConvocatorias.Identity.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;

namespace GestionConvocatorias.Identity.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class EvaluacionesController : ControllerBase
{
    private readonly AppDbContext _context;

    private const decimal PesoInnovacion = 0.25m;
    private const decimal PesoViabilidad = 0.20m;
    private const decimal PesoImpactoSocial = 0.20m;
    private const decimal PesoSustentabilidad = 0.15m;
    private const decimal PesoModeloNegocio = 0.20m;

    public EvaluacionesController(AppDbContext context)
    {
        _context = context;
    }

    private int UsuarioId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpPost("calificar")]
    [Authorize(Roles = "Evaluador")]
    public async Task<IActionResult> Calificar([FromBody] CrearEvaluacionDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var proyecto = await _context.Proyectos
            .FirstOrDefaultAsync(p => p.Id == dto.ProyectoId && p.EvaluadorId == UsuarioId);

        if (proyecto is null)
            return NotFound(new { mensaje = "El proyecto no existe o no está asignado al evaluador." });

        var puntajeTotal =
            dto.CalificacionInnovacion * PesoInnovacion +
            dto.CalificacionViabilidad * PesoViabilidad +
            dto.CalificacionImpactoSocial * PesoImpactoSocial +
            dto.CalificacionSustentabilidad * PesoSustentabilidad +
            dto.CalificacionModeloNegocio * PesoModeloNegocio;

        var evaluacion = new Evaluacion
        {
            ProyectoId = dto.ProyectoId,
            EvaluadorId = UsuarioId,
            CalificacionInnovacion = dto.CalificacionInnovacion,
            CalificacionViabilidad = dto.CalificacionViabilidad,
            CalificacionImpactoSocial = dto.CalificacionImpactoSocial,
            CalificacionSustentabilidad = dto.CalificacionSustentabilidad,
            CalificacionModeloNegocio = dto.CalificacionModeloNegocio,
            PuntajeTotal = Math.Round(puntajeTotal, 2),
            ObservacionesGenerales = dto.ObservacionesGenerales,
            FechaEvaluacion = DateTime.UtcNow
        };

        _context.Evaluaciones.Add(evaluacion);
        await _context.SaveChangesAsync();

        return Ok(new
        {
            mensaje = "Evaluación registrada exitosamente.",
            evaluacion.Id,
            puntajeTotal = evaluacion.PuntajeTotal
        });
    }

    [HttpPost("{id}/firmar")]
    [Authorize(Roles = "Evaluador")]
    public async Task<IActionResult> Firmar(int id)
    {
        var evaluacion = await _context.Evaluaciones
            .FirstOrDefaultAsync(e => e.Id == id && e.EvaluadorId == UsuarioId);

        if (evaluacion is null)
            return NotFound(new { mensaje = "La evaluación no existe o no está asignada al evaluador." });

        if (!string.IsNullOrEmpty(evaluacion.FirmaElectronica))
            return BadRequest(new { mensaje = "La evaluación ya ha sido firmada." });

        var datosFirma = $"{evaluacion.Id}{UsuarioId}{DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ss.fff")}";

        using var sha256 = SHA256.Create();
        var bytesFirma = sha256.ComputeHash(Encoding.UTF8.GetBytes(datosFirma));
        var hashBase64 = Convert.ToBase64String(bytesFirma);

        evaluacion.FirmaElectronica = hashBase64;
        await _context.SaveChangesAsync();

        return Ok(new { mensaje = "Firma electrónica registrada exitosamente.", evaluacion });
    }

    [HttpPost("sugerir/{proyectoId}")]
    [Authorize(Roles = "Coordinador,Administrador")]
    public async Task<IActionResult> Sugerir(int proyectoId)
    {
        var proyecto = await _context.Proyectos
            .FirstOrDefaultAsync(p => p.Id == proyectoId);

        if (proyecto is null)
            return NotFound(new { mensaje = "El proyecto no existe." });

        var evaluadores = await _context.Usuarios
            .Where(u => u.Rol == Roles.Evaluador)
            .ToListAsync();

        var sugeridos = EvaluacionService.SugerirEvaluadores(proyecto.Resumen, evaluadores);

        return Ok(sugeridos);
    }

    [HttpGet("proyecto/{proyectoId}")]
    [Authorize(Roles = "Coordinador,Administrador,Evaluador,DocenteAsesor")]
    public async Task<IActionResult> ObtenerPorProyecto(int proyectoId)
    {
        var evaluaciones = await _context.Evaluaciones
            .Include(e => e.Evaluador)
            .Where(e => e.ProyectoId == proyectoId)
            .ToListAsync();

        return Ok(evaluaciones);
    }

    [HttpGet("mias")]
    [Authorize(Roles = "Evaluador")]
    public async Task<IActionResult> ObtenerMisEvaluaciones()
    {
        var evaluaciones = await _context.Evaluaciones
            .Include(e => e.Proyecto)
                .ThenInclude(p => p!.Convocatoria)
            .Include(e => e.Proyecto)
                .ThenInclude(p => p!.Integrantes)
                    .ThenInclude(pe => pe.Usuario)
            .Where(e => e.EvaluadorId == UsuarioId)
            .OrderByDescending(e => e.FechaEvaluacion)
            .ToListAsync();

        return Ok(evaluaciones);
    }

    [HttpGet("proyecto/{proyectoId}/retroalimentacion")]
    public async Task<IActionResult> DescargarRetroalimentacion(int proyectoId)
    {
        var userId = UsuarioId;
        var esAdmin = User.IsInRole("Administrador") || User.IsInRole("Coordinador");

        var evaluacion = await _context.Evaluaciones
            .Include(e => e.Proyecto)
                .ThenInclude(p => p!.Convocatoria)
            .Include(e => e.Proyecto)
                .ThenInclude(p => p!.Integrantes)
                    .ThenInclude(pe => pe.Usuario)
            .Include(e => e.Evaluador)
            .FirstOrDefaultAsync(e => e.ProyectoId == proyectoId);

        if (evaluacion is null)
            return NotFound(new { mensaje = "No se encontró evaluación para este proyecto." });

        if (!esAdmin && !evaluacion.Proyecto!.Integrantes.Any(i => i.UsuarioId == userId)
            && evaluacion.EvaluadorId != userId)
            return Forbid();

        var integrantes = evaluacion.Proyecto!.Integrantes
            .Select(i => $"{i.Usuario?.Nombres} {i.Usuario?.Apellidos}")
            .ToList();

        var html = $@"
<!DOCTYPE html>
<html lang='es'>
<head>
<meta charset='UTF-8'>
<title>Retroalimentación - {evaluacion.Proyecto.Titulo}</title>
<style>
  body {{ font-family: 'Segoe UI', Arial, sans-serif; margin: 40px; color: #333; }}
  h1 {{ font-size: 24px; border-bottom: 2px solid #1a1a1a; padding-bottom: 8px; }}
  h2 {{ font-size: 18px; margin-top: 30px; color: #555; }}
  table {{ width: 100%; border-collapse: collapse; margin: 15px 0; }}
  th, td {{ border: 1px solid #ddd; padding: 10px 14px; text-align: left; font-size: 14px; }}
  th {{ background-color: #f5f5f5; font-weight: 600; }}
  .score {{ font-size: 28px; font-weight: bold; }}
  .obs {{ background: #f9f9f9; padding: 15px; border-radius: 8px; margin-top: 15px; }}
  .footer {{ margin-top: 40px; font-size: 12px; color: #999; text-align: center; border-top: 1px solid #eee; padding-top: 15px; }}
</style>
</head>
<body>
  <h1>Retroalimentación del Proyecto</h1>
  <table>
    <tr><th>Proyecto</th><td>{evaluacion.Proyecto.Titulo}</td></tr>
    <tr><th>Folio</th><td>{evaluacion.Proyecto.Folio}</td></tr>
    <tr><th>Convocatoria</th><td>{evaluacion.Proyecto.Convocatoria?.Titulo ?? "N/A"}</td></tr>
    <tr><th>Integrantes</th><td>{string.Join(", ", integrantes)}</td></tr>
    <tr><th>Evaluador</th><td>{evaluacion.Evaluador?.Nombres} {evaluacion.Evaluador?.Apellidos}</td></tr>
    <tr><th>Fecha de evaluación</th><td>{evaluacion.FechaEvaluacion:dd/MM/yyyy HH:mm}</td></tr>
    <tr><th>Calificación Final</th><td class='score'>{evaluacion.PuntajeTotal:F2}</td></tr>
  </table>

  <h2>Calificaciones por criterio</h2>
  <table>
    <tr><th>Criterio</th><th>Calificación (1-5)</th></tr>
    <tr><td>Innovación</td><td>{evaluacion.CalificacionInnovacion}/5</td></tr>
    <tr><td>Viabilidad</td><td>{evaluacion.CalificacionViabilidad}/5</td></tr>
    <tr><td>Impacto Social</td><td>{evaluacion.CalificacionImpactoSocial}/5</td></tr>
    <tr><td>Sustentabilidad</td><td>{evaluacion.CalificacionSustentabilidad}/5</td></tr>
    <tr><td>Modelo de Negocio</td><td>{evaluacion.CalificacionModeloNegocio}/5</td></tr>
  </table>

  {(string.IsNullOrWhiteSpace(evaluacion.ObservacionesGenerales) ? "" : $@"
  <h2>Observaciones generales</h2>
  <div class='obs'>
    <p>{evaluacion.ObservacionesGenerales}</p>
  </div>")}

  <div class='footer'>
    Generado por ConvocaEval IA - UTTT | {DateTime.Now:dd/MM/yyyy HH:mm}
  </div>
</body>
</html>";

        var bytes = Encoding.UTF8.GetBytes(html);
        return File(bytes, "text/html", $"retroalimentacion-{evaluacion.Proyecto.Folio}.html");
    }
}
