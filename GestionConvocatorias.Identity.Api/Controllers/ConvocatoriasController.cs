using System.Security.Claims;
using GestionConvocatorias.Identity.Api.Data;
using GestionConvocatorias.Identity.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace GestionConvocatorias.Identity.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ConvocatoriasController : ControllerBase
{
    private readonly AppDbContext _context;

    public ConvocatoriasController(AppDbContext context)
    {
        _context = context;
    }

    private int UsuarioId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet]
    public async Task<IActionResult> GetConvocatorias()
    {
        var convocatorias = await _context.Convocatorias.ToListAsync();
        return Ok(convocatorias);
    }

    [HttpGet("activas")]
    [AllowAnonymous]
    public async Task<IActionResult> GetActivas()
    {
        var convocatorias = await _context.Convocatorias
            .Where(c => c.Estado == "Activa" &&
                (c.FechaLimiteRegistro == default || c.FechaLimiteRegistro >= DateTime.UtcNow) &&
                c.FechaCierre >= DateTime.UtcNow)
            .OrderByDescending(c => c.FechaApertura)
            .ToListAsync();
        return Ok(convocatorias);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> ObtenerPorId(int id)
    {
        var convocatoria = await _context.Convocatorias.FindAsync(id);
        if (convocatoria is null)
            return NotFound(new { mensaje = "Convocatoria no encontrada." });
        return Ok(convocatoria);
    }

    [HttpGet("mis-registros")]
    [Authorize(Roles = "Estudiante")]
    public async Task<IActionResult> MisRegistros()
    {
        var registros = await _context.ConvocatoriaEstudiantes
            .Where(ce => ce.UsuarioId == UsuarioId)
            .Include(ce => ce.Convocatoria)
            .Select(ce => new
            {
                ce.ConvocatoriaId,
                ce.Convocatoria!.Clave,
                ce.Convocatoria.Titulo,
                ce.Convocatoria.Descripcion,
                ce.Convocatoria.TipoConvocatoria,
                ce.Convocatoria.FechaApertura,
                ce.Convocatoria.FechaCierre,
                ce.Convocatoria.Estado,
                ce.FechaRegistro
            })
            .ToListAsync();
        return Ok(registros);
    }

    [HttpPost("{id}/registrar")]
    [Authorize(Roles = "Estudiante")]
    public async Task<IActionResult> Registrar(int id)
    {
        var convocatoria = await _context.Convocatorias.FindAsync(id);
        if (convocatoria is null)
            return NotFound(new { mensaje = "Convocatoria no encontrada." });

        if (convocatoria.Estado != "Activa")
            return BadRequest(new { mensaje = "La convocatoria no está activa." });

        if (convocatoria.FechaLimiteRegistro != default && convocatoria.FechaLimiteRegistro < DateTime.UtcNow)
            return BadRequest(new { mensaje = "La fecha límite de registro ha pasado." });

        var yaRegistrado = await _context.ConvocatoriaEstudiantes
            .AnyAsync(ce => ce.ConvocatoriaId == id && ce.UsuarioId == UsuarioId);

        if (yaRegistrado)
            return BadRequest(new { mensaje = "Ya estás registrado en esta convocatoria." });

        var registro = new ConvocatoriaEstudiante
        {
            ConvocatoriaId = id,
            UsuarioId = UsuarioId,
            FechaRegistro = DateTime.UtcNow
        };

        _context.ConvocatoriaEstudiantes.Add(registro);
        await _context.SaveChangesAsync();

        return Ok(new { mensaje = "Registro exitoso a la convocatoria." });
    }

    [HttpGet("{id}/mi-proyecto")]
    [Authorize(Roles = "Estudiante")]
    public async Task<IActionResult> MiProyectoEnConvocatoria(int id)
    {
        var registrado = await _context.ConvocatoriaEstudiantes
            .AnyAsync(ce => ce.ConvocatoriaId == id && ce.UsuarioId == UsuarioId);

        if (!registrado)
            return BadRequest(new { mensaje = "No estás registrado en esta convocatoria." });

        var convocatoria = await _context.Convocatorias.FindAsync(id);

        var proyecto = await _context.Proyectos
            .Where(p => p.ConvocatoriaId == id && p.Integrantes.Any(pe => pe.UsuarioId == UsuarioId))
            .Include(p => p.Integrantes)
                .ThenInclude(pe => pe.Usuario)
            .Include(p => p.Avances)
            .FirstOrDefaultAsync();

        if (proyecto is null)
            return Ok(new { tieneProyecto = false });

        int progresoCalculado = 0;
        if (convocatoria != null && convocatoria.FechaApertura != default && convocatoria.FechaCierre != default)
        {
            var ahora = DateTime.UtcNow;
            var totalDias = (convocatoria.FechaCierre - convocatoria.FechaApertura).TotalDays;
            var diasTranscurridos = (ahora - convocatoria.FechaApertura).TotalDays;

            if (totalDias > 0)
            {
                progresoCalculado = Math.Min(100, Math.Max(0, (int)((diasTranscurridos / totalDias) * 100)));
            }
        }

        return Ok(new
        {
            tieneProyecto = true,
            proyecto.Id,
            proyecto.Titulo,
            proyecto.NombreEquipo,
            proyecto.Categoria,
            proyecto.Estado,
            progreso = progresoCalculado,
            proyecto.Folio,
            proyecto.RutaPropuestaPDF,
            proyecto.RutaCodigoFuente,
            proyecto.GitHubUrl,
            proyecto.FechaRegistro,
            integrantes = proyecto.Integrantes?.Select(pe => new
            {
                pe.UsuarioId,
                nombre = pe.Usuario?.Nombres,
                email = pe.Usuario?.Email
            }),
            totalAvances = proyecto.Avances?.Count ?? 0
        });
    }

    [HttpDelete("{id}/cancelar-registro")]
    [Authorize(Roles = "Estudiante")]
    public async Task<IActionResult> CancelarRegistro(int id)
    {
        var registro = await _context.ConvocatoriaEstudiantes
            .FirstOrDefaultAsync(ce => ce.ConvocatoriaId == id && ce.UsuarioId == UsuarioId);

        if (registro is null)
            return NotFound(new { mensaje = "No estás registrado en esta convocatoria." });

        var tieneProyecto = await _context.Proyectos
            .AnyAsync(p => p.ConvocatoriaId == id && p.Integrantes.Any(pe => pe.UsuarioId == UsuarioId));

        if (tieneProyecto)
            return BadRequest(new { mensaje = "No puedes cancelar porque ya tienes un proyecto registrado en esta convocatoria." });

        _context.ConvocatoriaEstudiantes.Remove(registro);
        await _context.SaveChangesAsync();

        return Ok(new { mensaje = "Registro cancelado." });
    }

    [HttpPost]
    [Authorize(Roles = "Administrador,Coordinador")]
    public async Task<IActionResult> Crear([FromBody] Convocatoria convocatoria)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        _context.Convocatorias.Add(convocatoria);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(ObtenerPorId), new { id = convocatoria.Id }, convocatoria);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Administrador,Coordinador")]
    public async Task<IActionResult> Actualizar(int id, [FromBody] Convocatoria convocatoria)
    {
        var existente = await _context.Convocatorias.FindAsync(id);
        if (existente is null)
            return NotFound(new { mensaje = "Convocatoria no encontrada." });

        existente.Clave = convocatoria.Clave;
        existente.Titulo = convocatoria.Titulo;
        existente.TipoConvocatoria = convocatoria.TipoConvocatoria;
        existente.Descripcion = convocatoria.Descripcion;
        existente.Objetivo = convocatoria.Objetivo;
        existente.FechaPublicacion = convocatoria.FechaPublicacion;
        existente.FechaApertura = convocatoria.FechaApertura;
        existente.FechaLimiteRegistro = convocatoria.FechaLimiteRegistro;
        existente.FechaEvaluacion = convocatoria.FechaEvaluacion;
        existente.FechaCierre = convocatoria.FechaCierre;
        existente.FechaPublicacionResultados = convocatoria.FechaPublicacionResultados;
        existente.Categorias = convocatoria.Categorias;
        existente.Estado = convocatoria.Estado;
        existente.NumeroMaximoProyectos = convocatoria.NumeroMaximoProyectos;
        existente.NumeroMaximoIntegrantes = convocatoria.NumeroMaximoIntegrantes;
        existente.NumeroEvaluadoresPorProyecto = convocatoria.NumeroEvaluadoresPorProyecto;
        existente.EscalaEvaluacion = convocatoria.EscalaEvaluacion;
        existente.RubricaAsignada = convocatoria.RubricaAsignada;

        await _context.SaveChangesAsync();
        return Ok(existente);
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Administrador,Coordinador")]
    public async Task<IActionResult> Eliminar(int id)
    {
        var convocatoria = await _context.Convocatorias.FindAsync(id);
        if (convocatoria is null)
            return NotFound(new { mensaje = "Convocatoria no encontrada." });

        _context.Convocatorias.Remove(convocatoria);
        await _context.SaveChangesAsync();
        return Ok(new { mensaje = "Convocatoria eliminada." });
    }
}
