using GestionConvocatorias.Identity.Api.Data;
using GestionConvocatorias.Identity.Api.DTOs.Proyectos;
using GestionConvocatorias.Identity.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace GestionConvocatorias.Identity.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AsesoriasController : ControllerBase
{
    private readonly AppDbContext _context;

    public AsesoriasController(AppDbContext context)
    {
        _context = context;
    }

    private int UsuarioId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpPost]
    [Authorize(Roles = "DocenteAsesor")]
    public async Task<IActionResult> Crear([FromBody] CrearAsesoriaDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var proyecto = await _context.Proyectos
            .FirstOrDefaultAsync(p => p.Id == dto.ProyectoId && p.DocenteAsesorId == UsuarioId);

        if (proyecto is null)
            return NotFound(new { mensaje = "El proyecto no existe o no está asignado como docente asesor." });

        var asesoria = new Asesoria
        {
            ProyectoId = dto.ProyectoId,
            DocenteAsesorId = UsuarioId,
            Titulo = dto.Titulo,
            Descripcion = dto.Descripcion,
            Recomendaciones = dto.Recomendaciones,
            TipoAsesoria = dto.TipoAsesoria,
            Calificacion = dto.Calificacion,
            FechaAsesoria = DateTime.UtcNow
        };

        _context.Asesorias.Add(asesoria);
        await _context.SaveChangesAsync();

        return Ok(new
        {
            mensaje = "Asesoría registrada exitosamente.",
            asesoria.Id
        });
    }

    [HttpGet("proyecto/{proyectoId}")]
    [Authorize(Roles = "DocenteAsesor,Estudiante,Coordinador,Administrador")]
    public async Task<IActionResult> ObtenerPorProyecto(int proyectoId)
    {
        var esDocente = User.IsInRole("DocenteAsesor");
        var esEstudiante = User.IsInRole("Estudiante");

        if (esDocente)
        {
            var esAsesor = await _context.Proyectos
                .AnyAsync(p => p.Id == proyectoId && p.DocenteAsesorId == UsuarioId);
            if (!esAsesor) return Forbid();
        }

        if (esEstudiante)
        {
            var esIntegrante = await _context.ProyectoEstudiantes
                .AnyAsync(pe => pe.ProyectoId == proyectoId && pe.UsuarioId == UsuarioId);
            if (!esIntegrante) return Forbid();
        }

        var asesorias = await _context.Asesorias
            .Include(a => a.DocenteAsesor)
            .Where(a => a.ProyectoId == proyectoId)
            .OrderByDescending(a => a.FechaAsesoria)
            .ToListAsync();

        return Ok(asesorias);
    }

    [HttpGet("mias")]
    [Authorize(Roles = "DocenteAsesor")]
    public async Task<IActionResult> ObtenerMias()
    {
        var asesorias = await _context.Asesorias
            .Include(a => a.Proyecto)
                .ThenInclude(p => p!.Convocatoria)
            .Include(a => a.Proyecto)
                .ThenInclude(p => p!.Integrantes)
                    .ThenInclude(pe => pe.Usuario)
            .Where(a => a.DocenteAsesorId == UsuarioId)
            .OrderByDescending(a => a.FechaAsesoria)
            .ToListAsync();

        return Ok(asesorias);
    }
}
