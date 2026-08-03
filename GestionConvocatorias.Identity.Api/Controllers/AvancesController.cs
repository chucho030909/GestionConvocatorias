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
public class AvancesController : ControllerBase
{
    private readonly AppDbContext _context;

    public AvancesController(AppDbContext context)
    {
        _context = context;
    }

    private int UsuarioId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpPost]
    [Authorize(Roles = "Estudiante")]
    public async Task<IActionResult> Crear([FromBody] CrearAvanceDto dto)
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

        var avance = new Avance
        {
            ProyectoId = dto.ProyectoId,
            UsuarioId = UsuarioId,
            Descripcion = dto.Descripcion,
            Porcentaje = dto.Porcentaje,
            Fecha = DateTime.UtcNow
        };

        _context.Avances.Add(avance);

        if (dto.Porcentaje >= 0 && dto.Porcentaje <= 100)
            proyecto.Progreso = dto.Porcentaje;

        await _context.SaveChangesAsync();

        return Ok(new { mensaje = "Avance registrado.", avance.Id });
    }

    [HttpGet("proyecto/{proyectoId}")]
    [Authorize(Roles = "Estudiante,DocenteAsesor,Coordinador,Administrador")]
    public async Task<IActionResult> ObtenerPorProyecto(int proyectoId)
    {
        var avances = await _context.Avances
            .Where(a => a.ProyectoId == proyectoId)
            .Include(a => a.Usuario)
            .ToListAsync();

        return Ok(avances);
    }
}
