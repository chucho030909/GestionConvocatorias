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
public class ProyectosController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IArchivoService _archivoService;

    public ProyectosController(AppDbContext context, IArchivoService archivoService)
    {
        _context = context;
        _archivoService = archivoService;
    }

    private int UsuarioId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpPost]
    [Authorize(Roles = "Estudiante,Administrador")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> CrearProyecto(
        [FromForm] CrearProyectoDto dto,
        IFormFile? propuestaPDF,
        IFormFile? codigoFuente,
        [FromForm] string? githubUrl,
        [FromForm] string? integrantesEmails)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var convocatoria = await _context.Convocatorias.FindAsync(dto.ConvocatoriaId);
        if (convocatoria is null)
            return BadRequest(new { mensaje = "La convocatoria especificada no existe." });

        // Validar propuesta PDF (obligatorio)
        if (propuestaPDF == null || propuestaPDF.Length == 0)
            return BadRequest(new { mensaje = "La propuesta PDF es obligatoria." });

        if (propuestaPDF.ContentType != "application/pdf")
            return BadRequest(new { mensaje = "La propuesta debe ser un archivo PDF." });

        if (propuestaPDF.Length > 10 * 1024 * 1024)
            return BadRequest(new { mensaje = "La propuesta no debe exceder 10 MB." });

        // Validar código fuente (obligatorio: ZIP o GitHub URL)
        if ((codigoFuente == null || codigoFuente.Length == 0) && string.IsNullOrEmpty(githubUrl))
            return BadRequest(new { mensaje = "Debe subir un archivo ZIP o proporcionar un link de GitHub." });

        string? rutaPDF = await _archivoService.GuardarArchivoAsync(propuestaPDF, "propuestas");

        string? rutaCodigo = null;
        if (codigoFuente != null && codigoFuente.Length > 0)
        {
            if (!codigoFuente.FileName.EndsWith(".zip", StringComparison.OrdinalIgnoreCase))
                return BadRequest(new { mensaje = "El código fuente debe ser un archivo ZIP." });

            if (codigoFuente.Length > 50 * 1024 * 1024)
                return BadRequest(new { mensaje = "El archivo ZIP no debe exceder 50 MB." });

            rutaCodigo = await _archivoService.GuardarArchivoAsync(codigoFuente, "codigo");
        }

        var totalProyectosEnConvocatoria = await _context.Proyectos
            .CountAsync(p => p.ConvocatoriaId == dto.ConvocatoriaId);

        var siguienteNumero = (totalProyectosEnConvocatoria + 1).ToString("D3");
        var folio = $"CONV-{DateTime.UtcNow.Year}-{siguienteNumero}";

        var proyecto = new Proyecto
        {
            ConvocatoriaId = dto.ConvocatoriaId,
            Titulo = dto.Titulo,
            NombreEquipo = dto.NombreEquipo,
            Categoria = dto.Categoria,
            Resumen = dto.Resumen ?? string.Empty,
            ObjetivoGeneral = dto.ObjetivoGeneral ?? string.Empty,
            ObjetivosEspecificos = dto.ObjetivosEspecificos ?? string.Empty,
            Carrera = dto.Carrera ?? string.Empty,
            LineaInvestigacion = dto.LineaInvestigacion ?? string.Empty,
            RutaPropuestaPDF = rutaPDF,
            RutaCodigoFuente = rutaCodigo,
            GitHubUrl = githubUrl,
            Folio = folio,
            FechaInicio = DateTime.UtcNow,
            Estado = EstadoProyecto.EnPropuesta,
            FechaRegistro = DateTime.UtcNow
        };

        _context.Proyectos.Add(proyecto);
        await _context.SaveChangesAsync();

        // Agregar creador como integrante
        _context.ProyectoEstudiantes.Add(new ProyectoEstudiante
        {
            ProyectoId = proyecto.Id,
            UsuarioId = UsuarioId,
            FechaAsignacion = DateTime.UtcNow
        });

        // Agregar otros integrantes por email
        if (!string.IsNullOrEmpty(integrantesEmails))
        {
            var emails = integrantesEmails.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
            var maxIntegrantes = convocatoria.NumeroMaximoIntegrantes;
            var integrantesActuales = 1; // El creador ya fue agregado

            foreach (var email in emails)
            {
                if (integrantesActuales >= maxIntegrantes) break;

                var estudiante = await _context.Usuarios
                    .FirstOrDefaultAsync(u => u.Email == email && u.Rol == Roles.Estudiante);

                if (estudiante == null) continue;

                var yaEsIntegrante = await _context.ProyectoEstudiantes
                    .AnyAsync(pe => pe.ProyectoId == proyecto.Id && pe.UsuarioId == estudiante.Id);

                if (yaEsIntegrante) continue;

                _context.ProyectoEstudiantes.Add(new ProyectoEstudiante
                {
                    ProyectoId = proyecto.Id,
                    UsuarioId = estudiante.Id,
                    FechaAsignacion = DateTime.UtcNow
                });
                integrantesActuales++;
            }
        }

        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(ObtenerPorId), new { id = proyecto.Id }, new
        {
            proyecto.Id,
            proyecto.Titulo,
            proyecto.Folio,
            proyecto.Estado,
            mensaje = "Proyecto creado exitosamente."
        });
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
        proyecto.NombreEquipo = dto.NombreEquipo;
        proyecto.Categoria = dto.Categoria;
        proyecto.Resumen = dto.Resumen ?? string.Empty;
        proyecto.ObjetivoGeneral = dto.ObjetivoGeneral ?? string.Empty;
        proyecto.ObjetivosEspecificos = dto.ObjetivosEspecificos ?? string.Empty;
        proyecto.Carrera = dto.Carrera ?? string.Empty;
        proyecto.LineaInvestigacion = dto.LineaInvestigacion ?? string.Empty;

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

    [HttpGet("archivos/{*ruta}")]
    public async Task<IActionResult> DescargarArchivo(string ruta)
    {
        try
        {
            var bytes = await _archivoService.ObtenerArchivoAsync(ruta);
            return File(bytes, "application/pdf", Path.GetFileName(ruta));
        }
        catch (FileNotFoundException)
        {
            return NotFound(new { mensaje = "Archivo no encontrado." });
        }
    }

    [HttpPost("{id}/integrantes")]
    [Authorize(Roles = "Estudiante")]
    public async Task<IActionResult> AgregarIntegrante(int id, [FromBody] AgregarIntegranteDto dto)
    {
        var esIntegrante = await _context.ProyectoEstudiantes
            .AnyAsync(pe => pe.ProyectoId == id && pe.UsuarioId == UsuarioId);

        if (!esIntegrante)
            return NotFound(new { mensaje = "El proyecto no existe o no eres integrante." });

        var proyecto = await _context.Proyectos
            .Include(p => p.Convocatoria)
            .Include(p => p.Integrantes)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (proyecto is null)
            return NotFound(new { mensaje = "El proyecto no existe." });

        if (proyecto.Integrantes != null && proyecto.Integrantes.Count >= proyecto.Convocatoria?.NumeroMaximoIntegrantes)
            return BadRequest(new { mensaje = $"El proyecto ya tiene el máximo de {proyecto.Convocatoria?.NumeroMaximoIntegrantes} integrantes." });

        var estudiante = await _context.Usuarios
            .FirstOrDefaultAsync(u => u.Email == dto.Email && u.Rol == Roles.Estudiante);

        if (estudiante is null)
            return BadRequest(new { mensaje = "No se encontró un estudiante con ese correo electrónico." });

        var yaEsIntegrante = await _context.ProyectoEstudiantes
            .AnyAsync(pe => pe.ProyectoId == id && pe.UsuarioId == estudiante.Id);

        if (yaEsIntegrante)
            return BadRequest(new { mensaje = "Este estudiante ya es integrante del proyecto." });

        var nuevoIntegrante = new ProyectoEstudiante
        {
            ProyectoId = id,
            UsuarioId = estudiante.Id,
            FechaAsignacion = DateTime.UtcNow
        };

        _context.ProyectoEstudiantes.Add(nuevoIntegrante);
        await _context.SaveChangesAsync();

        return Ok(new { mensaje = $"{estudiante.Nombres} {estudiante.Apellidos} fue agregado al proyecto." });
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
