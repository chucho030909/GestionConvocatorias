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
public class ProyectosController : ControllerBase
{
    private readonly AppDbContext _context;

    public ProyectosController(AppDbContext context)
    {
        _context = context;
    }

    private int UsuarioId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpPost]
    [Authorize(Roles = "Estudiante,Administrador")]
    public async Task<IActionResult> CrearProyecto([FromBody] CrearProyectoDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var proyecto = new Proyecto
        {
            ConvocatoriaId = dto.ConvocatoriaId,
            Titulo = dto.Titulo,
            Categoria = dto.Categoria,
            Resumen = dto.Resumen,
            ObjetivoGeneral = dto.ObjetivoGeneral,
            ObjetivosEspecificos = dto.ObjetivosEspecificos,
            Carrera = dto.Carrera,
            LineaInvestigacion = dto.LineaInvestigacion,
            VideoUrl = dto.VideoUrl,
            FechaInicio = dto.FechaInicio,
            FechaTermino = dto.FechaTermino,
            Estado = EstadoProyecto.EnPropuesta,
            FechaRegistro = DateTime.UtcNow
        };

        _context.Proyectos.Add(proyecto);
        await _context.SaveChangesAsync();

        var integrantesIds = dto.IntegrantesIds.ToList();
        if (!integrantesIds.Contains(UsuarioId))
        {
            integrantesIds.Add(UsuarioId);
        }

        foreach (var integranteId in integrantesIds)
        {
            var proyectoEstudiante = new ProyectoEstudiante
            {
                ProyectoId = proyecto.Id,
                UsuarioId = integranteId,
                FechaAsignacion = DateTime.UtcNow
            };
            _context.ProyectoEstudiantes.Add(proyectoEstudiante);
        }

        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(ObtenerPorId), new { id = proyecto.Id }, proyecto);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Estudiante,Administrador")]
    public async Task<IActionResult> ActualizarProyecto(int id, [FromBody] CrearProyectoDto dto)
    {
        var esIntegrante = await _context.ProyectoEstudiantes
            .AnyAsync(pe => pe.ProyectoId == id && pe.UsuarioId == UsuarioId);

        if (!esIntegrante)
            return NotFound(new { mensaje = "El proyecto no existe o no eres integrante del mismo." });

        var proyecto = await _context.Proyectos.FindAsync(id);
        if (proyecto is null)
            return NotFound(new { mensaje = "El proyecto no existe." });

        proyecto.Titulo = dto.Titulo;
        proyecto.Categoria = dto.Categoria;
        proyecto.Resumen = dto.Resumen;
        proyecto.ObjetivoGeneral = dto.ObjetivoGeneral;
        proyecto.ObjetivosEspecificos = dto.ObjetivosEspecificos;
        proyecto.Carrera = dto.Carrera;
        proyecto.LineaInvestigacion = dto.LineaInvestigacion;
        proyecto.VideoUrl = dto.VideoUrl;
        proyecto.FechaInicio = dto.FechaInicio;
        proyecto.FechaTermino = dto.FechaTermino;

        await _context.SaveChangesAsync();
        return Ok(proyecto);
    }

    [HttpGet("{id}")]
    [Authorize(Roles = "Administrador,Coordinador,DocenteAsesor,Evaluador,Estudiante")]
    public async Task<IActionResult> ObtenerPorId(int id)
    {
        var proyecto = await _context.Proyectos
            .Include(p => p.Convocatoria)
            .Include(p => p.Integrantes)
                .ThenInclude(pe => pe.Usuario)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (proyecto is null)
            return NotFound(new { mensaje = "El proyecto no existe." });

        return Ok(proyecto);
    }

    [HttpGet("MisProyectos")]
    [Authorize(Roles = "Estudiante")]
    public async Task<IActionResult> MisProyectos()
    {
        var proyectos = await _context.ProyectoEstudiantes
            .Where(pe => pe.UsuarioId == UsuarioId)
            .Include(pe => pe.Proyecto)
            .Select(pe => pe.Proyecto)
            .ToListAsync();

        return Ok(proyectos);
    }

    [HttpGet("AsignadosDocente")]
    [Authorize(Roles = "DocenteAsesor")]
    public async Task<IActionResult> AsignadosDocente()
    {
        var proyectos = await _context.Proyectos
            .Where(p => p.DocenteAsesorId == UsuarioId)
            .Include(p => p.Convocatoria)
            .Include(p => p.Integrantes)
                .ThenInclude(pe => pe.Usuario)
            .ToListAsync();

        return Ok(proyectos);
    }

    [HttpGet("AsignadosEvaluador")]
    [Authorize(Roles = "Evaluador")]
    public async Task<IActionResult> AsignadosEvaluador()
    {
        var proyectos = await _context.Proyectos
            .Where(p => p.EvaluadorId == UsuarioId)
            .Include(p => p.Convocatoria)
            .Include(p => p.Integrantes)
                .ThenInclude(pe => pe.Usuario)
            .ToListAsync();

        return Ok(proyectos);
    }

    [HttpGet("Coordinador")]
    [Authorize(Roles = "Coordinador")]
    public async Task<IActionResult> VistaCoordinador()
    {
        var proyectos = await _context.Proyectos
            .Include(p => p.Convocatoria)
            .Include(p => p.Integrantes)
                .ThenInclude(pe => pe.Usuario)
            .ToListAsync();

        return Ok(proyectos);
    }

    [HttpGet("Todos")]
    [Authorize(Roles = "Administrador")]
    public async Task<IActionResult> Todos()
    {
        var proyectos = await _context.Proyectos
            .Include(p => p.Convocatoria)
            .Include(p => p.Integrantes)
                .ThenInclude(pe => pe.Usuario)
            .ToListAsync();

        return Ok(proyectos);
    }

    [HttpPut("{id}/estado")]
    [Authorize(Roles = "DocenteAsesor,Coordinador,Administrador")]
    public async Task<IActionResult> CambiarEstado(int id, [FromBody] CambiarEstadoDto dto)
    {
        var estadosPermitidos = new[] { "EnPropuesta", "EnRevision", "Aprobado", "EnDesarrollo", "Finalizado", "Cancelado" };
        if (!estadosPermitidos.Contains(dto.Estado))
            return BadRequest(new { mensaje = "Estado no permitido." });

        var proyecto = await _context.Proyectos.FirstOrDefaultAsync(p => p.Id == id);
        if (proyecto is null)
            return NotFound(new { mensaje = "El proyecto no existe." });

        if (Enum.TryParse<EstadoProyecto>(dto.Estado, out var estadoEnum))
        {
            proyecto.Estado = estadoEnum;
        }
        else
        {
            return BadRequest(new { mensaje = "Estado no válido." });
        }

        await _context.SaveChangesAsync();

        return Ok(proyecto);
    }

    [HttpPut("{id}/asignacion")]
    [Authorize(Roles = "Coordinador,Administrador")]
    public async Task<IActionResult> Asignar(int id, [FromBody] AsignacionDto dto)
    {
        var proyecto = await _context.Proyectos.FirstOrDefaultAsync(p => p.Id == id);
        if (proyecto is null)
            return NotFound(new { mensaje = "El proyecto no existe." });

        if (dto.DocenteAsesorId.HasValue)
        {
            var docente = await _context.Usuarios.FirstOrDefaultAsync(u => u.Id == dto.DocenteAsesorId && u.Rol == Roles.DocenteAsesor);
            if (docente is null)
                return BadRequest(new { mensaje = "El docente asesor especificado no es válido." });
            proyecto.DocenteAsesorId = dto.DocenteAsesorId;
        }

        if (dto.EvaluadorId.HasValue)
        {
            var evaluador = await _context.Usuarios.FirstOrDefaultAsync(u => u.Id == dto.EvaluadorId && u.Rol == Roles.Evaluador);
            if (evaluador is null)
                return BadRequest(new { mensaje = "El evaluador especificado no es válido." });
            proyecto.EvaluadorId = dto.EvaluadorId;
        }

        await _context.SaveChangesAsync();
        return Ok(proyecto);
    }
}
