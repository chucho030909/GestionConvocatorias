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
    [Authorize(Roles = "Coordinador,Administrador,Evaluador")]
    public async Task<IActionResult> ObtenerPorProyecto(int proyectoId)
    {
        var evaluaciones = await _context.Evaluaciones
            .Include(e => e.Evaluador)
            .Where(e => e.ProyectoId == proyectoId)
            .ToListAsync();

        return Ok(evaluaciones);
    }
}
