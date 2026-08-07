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
    private readonly IEmailService _emailService;
    private readonly GitHubService _githubService;

    public ProyectosController(AppDbContext context, IArchivoService archivoService, IEmailService emailService, GitHubService githubService)
    {
        _context = context;
        _archivoService = archivoService;
        _emailService = emailService;
        _githubService = githubService;
    }

    private int UsuarioId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    private static bool TieneRol(Usuario usuario, string rol)
    {
        return usuario.Rol != null &&
            usuario.Rol.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                .Contains(rol);
    }

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

        // Verificar que la convocatoria esté activa
        if (convocatoria.Estado != "Activa")
            return BadRequest(new { mensaje = "La convocatoria no está activa." });

        // Verificar que no haya pasado la fecha límite de registro
        if (DateTime.UtcNow > convocatoria.FechaLimiteRegistro)
            return BadRequest(new { mensaje = "La fecha límite de registro ha expirado." });

        // Verificar que el estudiante esté registrado en la convocatoria (solo para estudiantes)
        var esAdmin = User.IsInRole("Administrador");
        if (!esAdmin)
        {
            var estaRegistrado = await _context.ConvocatoriaEstudiantes
                .AnyAsync(ce => ce.ConvocatoriaId == dto.ConvocatoriaId && ce.UsuarioId == UsuarioId);

            if (!estaRegistrado)
                return BadRequest(new { mensaje = "No estás registrado en esta convocatoria. Regístrate primero." });
        }

        // Verificar que no tenga ya un proyecto en esta convocatoria
        var yaTieneProyecto = await _context.Proyectos
            .AnyAsync(p => p.ConvocatoriaId == dto.ConvocatoriaId &&
                          p.Integrantes.Any(i => i.UsuarioId == UsuarioId));

        if (yaTieneProyecto)
            return BadRequest(new { mensaje = "Ya tienes un proyecto registrado en esta convocatoria." });

        // Verificar número máximo de proyectos
        var proyectosActuales = await _context.Proyectos.CountAsync(p => p.ConvocatoriaId == dto.ConvocatoriaId);
        if (proyectosActuales >= convocatoria.NumeroMaximoProyectos)
            return BadRequest(new { mensaje = "Se alcanzó el número máximo de proyectos para esta convocatoria." });

        // Validar propuesta PDF (obligatorio)
        if (propuestaPDF == null || propuestaPDF.Length == 0)
            return BadRequest(new { mensaje = "La propuesta PDF es obligatoria." });

        if (propuestaPDF.ContentType != "application/pdf")
            return BadRequest(new { mensaje = "La propuesta debe ser un archivo PDF." });

        if (propuestaPDF.Length > 10 * 1024 * 1024)
            return BadRequest(new { mensaje = "La propuesta no debe exceder 10 MB." });

        string? rutaPDF = await _archivoService.GuardarArchivoAsync(propuestaPDF, "propuestas");

        // Código fuente (opcional: ZIP o GitHub URL)
        string? rutaCodigo = null;
        if (codigoFuente != null && codigoFuente.Length > 0)
        {
            if (!codigoFuente.FileName.EndsWith(".zip", StringComparison.OrdinalIgnoreCase))
                return BadRequest(new { mensaje = "El código fuente debe ser un archivo ZIP." });

            if (codigoFuente.Length > 50 * 1024 * 1024)
                return BadRequest(new { mensaje = "El archivo ZIP no debe exceder 50 MB." });

            rutaCodigo = await _archivoService.GuardarArchivoAsync(codigoFuente, "codigo");
        }

        var totalProyectos = await _context.Proyectos.CountAsync();
        var siguienteNumero = (totalProyectos + 1).ToString("D3");
        var folio = $"CONV-{DateTime.UtcNow.Year}-{siguienteNumero}";

        var proyecto = new Proyecto
        {
            ConvocatoriaId = dto.ConvocatoriaId,
            Titulo = dto.Titulo,
            NombreEquipo = dto.NombreEquipo,
            Categoria = dto.Categoria,
            AreaConocimiento = dto.AreaConocimiento ?? string.Empty,
            LineaInvestigacion = dto.LineaInvestigacion ?? string.Empty,
            Modalidad = dto.Modalidad ?? string.Empty,
            Problema = dto.Problema ?? string.Empty,
            Justificacion = dto.Justificacion ?? string.Empty,
            Resumen = dto.Resumen ?? string.Empty,
            ObjetivoGeneral = dto.ObjetivoGeneral ?? string.Empty,
            ObjetivosEspecificos = dto.ObjetivosEspecificos ?? string.Empty,
            Carrera = dto.Carrera ?? string.Empty,
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
            .Include(p => p.DocenteAsesor)
            .Include(p => p.Evaluador)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (proyecto is null)
            return NotFound(new { mensaje = "El proyecto no existe." });

        // Los estudiantes solo pueden ver proyectos de los que son integrantes
        var esEstudiante = User.IsInRole("Estudiante");
        if (esEstudiante && !User.IsInRole("DocenteAsesor") && !User.IsInRole("Evaluador"))
        {
            var esIntegrante = proyecto.Integrantes?.Any(i => i.UsuarioId == UsuarioId) ?? false;
            if (!esIntegrante)
                return Forbid();
        }

        return Ok(proyecto);
    }

    [HttpPost("{id}/crear-repositorio")]
    [Authorize(Roles = "Estudiante,Administrador")]
    public async Task<IActionResult> CrearRepositorio(int id)
    {
        var proyecto = await _context.Proyectos.FindAsync(id);
        if (proyecto is null)
            return NotFound(new { mensaje = "El proyecto no existe." });

        var esIntegrante = await _context.ProyectoEstudiantes
            .AnyAsync(pe => pe.ProyectoId == id && pe.UsuarioId == UsuarioId);

        if (!esIntegrante)
            return Forbid();

        if (!string.IsNullOrEmpty(proyecto.GitHubUrl))
            return BadRequest(new { mensaje = "Este proyecto ya tiene un repositorio asignado." });

        try
        {
            var nombreRepo = $"proyecto-{proyecto.Folio}".ToLower().Replace(" ", "-");
            var descripcion = $"Proyecto: {proyecto.Titulo} - {proyecto.NombreEquipo}";

            var resultado = await _githubService.CrearRepositorioAsync(nombreRepo, descripcion);

            proyecto.GitHubUrl = resultado.HtmlUrl;
            await _context.SaveChangesAsync();

            return Ok(new
            {
                mensaje = "Repositorio creado exitosamente.",
                githubUrl = resultado.HtmlUrl,
                cloneUrl = resultado.CloneUrl,
                sshUrl = resultado.SshUrl
            });
        }
        catch (Exception ex)
        {
            return BadRequest(new { mensaje = $"Error al crear el repositorio: {ex.Message}" });
        }
    }

    [HttpGet("MisProyectos")]
    [Authorize(Roles = "Estudiante")]
    public async Task<IActionResult> MisProyectos()
    {
        var proyectos = await _context.ProyectoEstudiantes
            .Where(pe => pe.UsuarioId == UsuarioId)
            .Include(pe => pe.Proyecto)
                .ThenInclude(p => p!.DocenteAsesor)
            .Include(pe => pe.Proyecto)
                .ThenInclude(p => p!.Evaluador)
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
            .Include(p => p.DocenteAsesor)
            .Include(p => p.Evaluador)
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
            .Include(p => p.DocenteAsesor)
            .Include(p => p.Evaluador)
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
            .Include(p => p.DocenteAsesor)
            .Include(p => p.Evaluador)
            .ToListAsync();

        return Ok(proyectos);
    }

    [HttpGet("archivos/{*ruta}")]
    [Authorize]
    public async Task<IActionResult> DescargarArchivo(string ruta)
    {
        try
        {
            var bytes = await _archivoService.ObtenerArchivoAsync(ruta);

            // Verificar que el usuario tiene acceso al archivo
            var esAdmin = User.IsInRole("Administrador") || User.IsInRole("Coordinador");
            if (!esAdmin)
            {
                // Verificar que el archivo pertenece a un proyecto del usuario
                var rutaNormalizada = ruta.Replace('\\', '/').ToLower();
                var esArchivoPropio = false;

                // Verificar si es un archivo de propuesta
                if (rutaNormalizada.StartsWith("propuestas/"))
                {
                    var nombreArchivo = Path.GetFileName(ruta);
                    esArchivoPropio = await _context.Proyectos
                        .AnyAsync(p => p.RutaPropuestaPDF != null &&
                                      p.RutaPropuestaPDF.Contains(nombreArchivo) &&
                                      (p.Integrantes.Any(i => i.UsuarioId == UsuarioId) ||
                                       p.EvaluadorId == UsuarioId ||
                                       p.DocenteAsesorId == UsuarioId));
                }
                // Verificar si es un archivo de código
                else if (rutaNormalizada.StartsWith("codigo/"))
                {
                    var nombreArchivo = Path.GetFileName(ruta);
                    esArchivoPropio = await _context.Proyectos
                        .AnyAsync(p => p.RutaCodigoFuente != null &&
                                      p.RutaCodigoFuente.Contains(nombreArchivo) &&
                                      (p.Integrantes.Any(i => i.UsuarioId == UsuarioId) ||
                                       p.EvaluadorId == UsuarioId ||
                                       p.DocenteAsesorId == UsuarioId));
                }

                if (!esArchivoPropio)
                    return Forbid();
            }

            var extension = Path.GetExtension(ruta).ToLowerInvariant();
            var contentType = extension switch
            {
                ".pdf" => "application/pdf",
                ".zip" => "application/zip",
                ".doc" or ".docx" => "application/msword",
                ".xls" or ".xlsx" => "application/vnd.ms-excel",
                _ => "application/octet-stream"
            };

            return File(bytes, contentType, Path.GetFileName(ruta));
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
            .Include(p => p.DocenteAsesor)
            .Include(p => p.Evaluador)
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
        var proyecto = await _context.Proyectos
            .Include(p => p.Convocatoria)
            .FirstOrDefaultAsync(p => p.Id == id);
        if (proyecto is null)
            return NotFound(new { mensaje = "El proyecto no existe." });

        if (dto.DocenteAsesorId.HasValue)
        {
            var docente = await _context.Usuarios.FindAsync(dto.DocenteAsesorId.Value);
            if (docente is null || !TieneRol(docente, Roles.DocenteAsesor))
                return BadRequest(new { mensaje = "El docente asesor especificado no es válido." });
            proyecto.DocenteAsesorId = dto.DocenteAsesorId;
        }

        if (dto.EvaluadorId.HasValue)
        {
            var evaluador = await _context.Usuarios.FindAsync(dto.EvaluadorId.Value);
            if (evaluador is null || !TieneRol(evaluador, Roles.Evaluador))
                return BadRequest(new { mensaje = "El evaluador especificado no es válido." });
            proyecto.EvaluadorId = dto.EvaluadorId;
        }

        await _context.SaveChangesAsync();

        try
        {
            if (dto.EvaluadorId.HasValue)
            {
                var evaluador = await _context.Usuarios.FindAsync(dto.EvaluadorId.Value);
                if (evaluador?.Email != null)
                {
                    var asunto = $"Invitación a evaluar proyecto: {proyecto.Titulo}";
                    var cuerpo = $@"
                        <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;'>
                            <h2 style='color: #1a1a2e;'>ConvocaEval IA - Invitación de Evaluación</h2>
                            <p>Hola <strong>{evaluador.Nombres} {evaluador.Apellidos}</strong>,</p>
                            <p>Has sido asignado(a) como evaluador(a) del siguiente proyecto:</p>
                            <div style='background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 15px 0;'>
                                <p><strong>Folio:</strong> {proyecto.Folio}</p>
                                <p><strong>Título:</strong> {proyecto.Titulo}</p>
                                <p><strong>Categoría:</strong> {proyecto.Categoria}</p>
                                <p><strong>Convocatoria:</strong> {proyecto.Convocatoria?.Titulo}</p>
                            </div>
                            <p>Por favor, ingresa a la plataforma para revisar la propuesta y realizar la evaluación.</p>
                            <p style='color: #6b7280; font-size: 12px; margin-top: 30px;'>Este es un correo generado automáticamente por ConvocaEval IA.</p>
                        </div>";
                    await _emailService.EnviarCorreoAsync(evaluador.Email, asunto, cuerpo);
                }
            }

            if (dto.DocenteAsesorId.HasValue)
            {
                var docente = await _context.Usuarios.FindAsync(dto.DocenteAsesorId.Value);
                if (docente?.Email != null)
                {
                    var asunto = $"Asignación como docente asesor: {proyecto.Titulo}";
                    var cuerpo = $@"
                        <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;'>
                            <h2 style='color: #1a1a2e;'>ConvocaEval IA - Asignación de Asesoría</h2>
                            <p>Hola <strong>{docente.Nombres} {docente.Apellidos}</strong>,</p>
                            <p>Has sido asignado(a) como docente asesor(a) del siguiente proyecto:</p>
                            <div style='background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 15px 0;'>
                                <p><strong>Folio:</strong> {proyecto.Folio}</p>
                                <p><strong>Título:</strong> {proyecto.Titulo}</p>
                                <p><strong>Categoría:</strong> {proyecto.Categoria}</p>
                                <p><strong>Convocatoria:</strong> {proyecto.Convocatoria?.Titulo}</p>
                            </div>
                            <p>Por favor, ingresa a la plataforma para revisar el avance del proyecto.</p>
                            <p style='color: #6b7280; font-size: 12px; margin-top: 30px;'>Este es un correo generado automáticamente por ConvocaEval IA.</p>
                        </div>";
                    await _emailService.EnviarCorreoAsync(docente.Email, asunto, cuerpo);
                }
            }
        }
        catch { }

        return Ok(proyecto);
    }

    [HttpPost("{id}/invitar-evaluador")]
    [Authorize(Roles = "Administrador,Coordinador")]
    public async Task<IActionResult> InvitarEvaluador(int id, [FromBody] InvitarEvaluadorDto dto)
    {
        var proyecto = await _context.Proyectos
            .Include(p => p.Convocatoria)
            .FirstOrDefaultAsync(p => p.Id == id);
        if (proyecto is null)
            return NotFound(new { mensaje = "El proyecto no existe." });

        var evaluador = await _context.Usuarios.FindAsync(dto.EvaluadorId);
        if (evaluador is null || !TieneRol(evaluador, Roles.Evaluador))
            return BadRequest(new { mensaje = "El evaluador especificado no es válido." });

        if (proyecto.EvaluadorId == dto.EvaluadorId)
            return BadRequest(new { mensaje = "Este evaluador ya está asignado al proyecto." });

        proyecto.EvaluadorId = dto.EvaluadorId;
        await _context.SaveChangesAsync();

        try
        {
            var asunto = $"Invitación a evaluar proyecto: {proyecto.Titulo}";
            var cuerpo = $@"
                <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;'>
                    <h2 style='color: #1a1a2e;'>ConvocaEval IA - Invitación de Evaluación</h2>
                    <p>Hola <strong>{evaluador.Nombres} {evaluador.Apellidos}</strong>,</p>
                    <p>Has sido invitado(a) a evaluar el siguiente proyecto:</p>
                    <div style='background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 15px 0;'>
                        <p><strong>Folio:</strong> {proyecto.Folio}</p>
                        <p><strong>Título:</strong> {proyecto.Titulo}</p>
                        <p><strong>Categoría:</strong> {proyecto.Categoria}</p>
                        <p><strong>Convocatoria:</strong> {proyecto.Convocatoria?.Titulo}</p>
                    </div>
                    <p>Por favor, ingresa a la plataforma para revisar la propuesta y realizar la evaluación.</p>
                    <p style='color: #6b7280; font-size: 12px; margin-top: 30px;'>Este es un correo generado automáticamente por ConvocaEval IA.</p>
                </div>";

            await _emailService.EnviarCorreoAsync(evaluador.Email!, asunto, cuerpo);
        }
        catch (Exception ex)
        {
            return Ok(new { mensaje = "Evaluador asignado correctamente, pero no se pudo enviar el correo de invitación.", evaluadorId = evaluador.Id });
        }

        return Ok(new { mensaje = "Evaluador asignado y notificado por correo exitosamente.", evaluadorId = evaluador.Id });
    }

    [HttpPut("{id}/rechazar-evaluador")]
    [Authorize(Roles = "Evaluador")]
    public async Task<IActionResult> RechazarEvaluador(int id)
    {
        var proyecto = await _context.Proyectos.FindAsync(id);
        if (proyecto is null)
            return NotFound(new { mensaje = "El proyecto no existe." });

        if (proyecto.EvaluadorId != UsuarioId)
            return Forbid();

        proyecto.EvaluadorId = null;
        await _context.SaveChangesAsync();

        return Ok(new { mensaje = "Has rechazado la evaluación de este proyecto." });
    }
}
