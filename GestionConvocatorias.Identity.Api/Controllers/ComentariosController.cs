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
public class ComentariosController : ControllerBase
{
    private readonly AppDbContext _context;

    public ComentariosController(AppDbContext context)
    {
        _context = context;
    }

    private int UsuarioId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    // DocenteAsesor: retroalimentación sobre proyectos asignados
    [HttpPost]
    [Authorize(Roles = "DocenteAsesor")]
    public async Task<IActionResult> Crear([FromBody] CrearComentarioDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var proyecto = await _context.Proyectos
            .FirstOrDefaultAsync(p => p.Id == dto.ProyectoId && p.DocenteAsesorId == UsuarioId);

        if (proyecto is null)
            return NotFound(new { mensaje = "El proyecto no existe o no está asignado al docente." });

        var comentario = new Comentario
        {
            ProyectoId = dto.ProyectoId,
            UsuarioId = UsuarioId,
            Texto = dto.Texto,
            Fecha = DateTime.UtcNow
        };

        _context.Comentarios.Add(comentario);
        await _context.SaveChangesAsync();

        return Ok(new { mensaje = "Comentario registrado.", comentario.Id });
    }

    [HttpGet("proyecto/{proyectoId}")]
    [Authorize(Roles = "DocenteAsesor,Estudiante,Coordinador,Administrador")]
    public async Task<IActionResult> ObtenerPorProyecto(int proyectoId)
    {
        var comentarios = await _context.Comentarios
            .Where(c => c.ProyectoId == proyectoId)
            .Include(c => c.Usuario)
            .ToListAsync();

        return Ok(comentarios);
    }
}
