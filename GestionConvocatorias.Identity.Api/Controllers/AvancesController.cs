using GestionConvocatorias.Identity.Api.Data;
using GestionConvocatorias.Identity.Api.DTOs.Proyectos;
using GestionConvocatorias.Identity.Api.Models;
using GestionConvocatorias.Identity.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace GestionConvocatorias.Identity.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AvancesController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IArchivoService _archivoService;

    public AvancesController(AppDbContext context, IArchivoService archivoService)
    {
        _context = context;
        _archivoService = archivoService;
    }

    private int UsuarioId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpPost]
    [Authorize(Roles = "Estudiante")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> Crear([FromForm] CrearAvanceDto dto, IFormFile? documento)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var esIntegrante = await _context.ProyectoEstudiantes
            .AnyAsync(pe => pe.ProyectoId == dto.ProyectoId && pe.UsuarioId == UsuarioId);

        if (!esIntegrante)
            return NotFound(new { mensaje = "El proyecto no existe o no eres integrante del mismo." });

        var proyecto = await _context.Proyectos.FindAsync(dto.ProyectoId);
        if (proyecto is null)
            return NotFound(new { mensaje = "El proyecto no existe." });

        string? rutaDocumento = null;
        if (documento != null && documento.Length > 0)
        {
            if (documento.ContentType != "application/pdf")
                return BadRequest(new { mensaje = "Solo se permiten archivos PDF." });

            if (documento.Length > 10 * 1024 * 1024)
                return BadRequest(new { mensaje = "El archivo no debe exceder 10 MB." });

            rutaDocumento = await _archivoService.GuardarArchivoAsync(documento, "avances");
        }

        var avance = new Avance
        {
            ProyectoId = dto.ProyectoId,
            UsuarioId = UsuarioId,
            Descripcion = dto.Descripcion,
            RutaDocumento = rutaDocumento,
            Porcentaje = 0,
            Fecha = DateTime.UtcNow
        };

        _context.Avances.Add(avance);
        await _context.SaveChangesAsync();

        return Ok(new { mensaje = "Avance registrado.", avance.Id });
    }

    [HttpGet("proyecto/{proyectoId}")]
    [Authorize(Roles = "Estudiante,DocenteAsesor,Coordinador,Administrador")]
    public async Task<IActionResult> ObtenerPorProyecto(int proyectoId)
    {
        var esIntegrante = await _context.ProyectoEstudiantes
            .AnyAsync(pe => pe.ProyectoId == proyectoId && pe.UsuarioId == UsuarioId);

        var esDocente = await _context.Proyectos
            .AnyAsync(p => p.Id == proyectoId && p.DocenteAsesorId == UsuarioId);

        var esCoordinadorAdmin = User.IsInRole("Coordinador") || User.IsInRole("Administrador");

        if (!esIntegrante && !esDocente && !esCoordinadorAdmin)
            return Forbid();

        var avances = await _context.Avances
            .Where(a => a.ProyectoId == proyectoId)
            .Include(a => a.Usuario)
            .OrderByDescending(a => a.Fecha)
            .ToListAsync();

        return Ok(avances.Select(a => new
        {
            a.Id,
            a.Descripcion,
            a.RutaDocumento,
            a.Porcentaje,
            a.Fecha,
            autor = a.Usuario?.Nombres
        }));
    }
}
