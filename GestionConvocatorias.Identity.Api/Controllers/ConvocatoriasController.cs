using System.Data;
using System.Security.Claims;
using System.Text.RegularExpressions;
using GestionConvocatorias.Identity.Api.Data;
using GestionConvocatorias.Identity.Api.DTOs;
using GestionConvocatorias.Identity.Api.Models;
using GestionConvocatorias.Identity.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace GestionConvocatorias.Identity.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ConvocatoriasController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IConvocatoriaArchivoService _archivoService;
    private readonly ILogger<ConvocatoriasController> _logger;

    public ConvocatoriasController(AppDbContext context, IConvocatoriaArchivoService archivoService, ILogger<ConvocatoriasController> logger)
    {
        _context = context;
        _archivoService = archivoService;
        _logger = logger;
    }

    private int UsuarioId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet]
    public async Task<IActionResult> GetConvocatorias()
    {
        var esEstudiante = User.IsInRole("Estudiante");

        var query = _context.Convocatorias.AsQueryable();

        if (esEstudiante)
        {
            query = query.Where(c => c.Estado == "Activa" &&
                (c.FechaLimiteRegistro == default || c.FechaLimiteRegistro >= DateTime.UtcNow) &&
                c.FechaCierre >= DateTime.UtcNow);
        }

        var convocatorias = await query.OrderByDescending(c => c.FechaApertura).ToListAsync();
        var dto = convocatorias.Select(MapToResponseDto);
        return Ok(dto);
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
        var dto = convocatorias.Select(MapToResponseDto);
        return Ok(dto);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> ObtenerPorId(int id)
    {
        var convocatoria = await _context.Convocatorias.FindAsync(id);
        if (convocatoria is null)
            return NotFound(new { mensaje = "Convocatoria no encontrada." });
        return Ok(MapToResponseDto(convocatoria));
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
    [Consumes("multipart/form-data")]
    [Authorize(Roles = "Administrador,Coordinador")]
    public async Task<IActionResult> Crear([FromForm] CrearConvocatoriaDto dto,
        IFormFile? basesPDF, IFormFile? convocatoriaPDF, IFormFile? formatos)
    {
        _logger.LogInformation("POST /api/convocatorias - Inicio creacion");

        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var erroresFechas = ValidarFechas(dto, esCreacion: true);
        if (erroresFechas.Count > 0)
            return BadRequest(new { mensaje = "Error en las fechas.", errores = erroresFechas });

        var archivosNuevos = new List<string>();

        try
        {
            ValidarArchivo(basesPDF, new[] { ".pdf" }, "bases");
            ValidarArchivo(convocatoriaPDF, new[] { ".pdf" }, "convocatoria");
            ValidarArchivo(formatos, new[] { ".pdf", ".doc", ".docx", ".xls", ".xlsx" }, "formatos");
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { mensaje = ex.Message });
        }

        await using var transaction = await _context.Database.BeginTransactionAsync();

        try
        {
            var clave = await GenerarClaveAsync();
            _logger.LogInformation("Clave generada: {Clave}", clave);

            var convocatoria = new Convocatoria
            {
                Clave = clave,
                Titulo = dto.Titulo,
                TipoConvocatoria = dto.TipoConvocatoria,
                Descripcion = dto.Descripcion,
                Objetivo = dto.Objetivo,
                FechaPublicacion = dto.FechaPublicacion,
                FechaApertura = dto.FechaApertura,
                FechaLimiteRegistro = dto.FechaLimiteRegistro,
                FechaEvaluacion = dto.FechaEvaluacion,
                FechaCierre = dto.FechaCierre,
                FechaPublicacionResultados = dto.FechaPublicacionResultados,
                Categorias = dto.Categorias,
                Estado = dto.Estado,
                NumeroMaximoProyectos = dto.NumeroMaximoProyectos,
                NumeroMaximoIntegrantes = dto.NumeroMaximoIntegrantes,
                NumeroEvaluadoresPorProyecto = dto.NumeroEvaluadoresPorProyecto,
                EscalaEvaluacion = dto.EscalaEvaluacion,
                RubricaAsignada = dto.RubricaAsignada,
                LinkRubrica = dto.LinkRubrica
            };

            _context.Convocatorias.Add(convocatoria);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Convocatoria creada con Id={Id}", convocatoria.Id);

            if (basesPDF != null)
            {
                var ruta = await _archivoService.GuardarArchivoAsync(basesPDF, convocatoria.Id, "bases");
                convocatoria.RutaBases = ruta;
                archivosNuevos.Add(ruta);
            }
            if (convocatoriaPDF != null)
            {
                var ruta = await _archivoService.GuardarArchivoAsync(convocatoriaPDF, convocatoria.Id, "convocatoria");
                convocatoria.RutaConvocatoriaPDF = ruta;
                archivosNuevos.Add(ruta);
            }
            if (formatos != null)
            {
                var ruta = await _archivoService.GuardarArchivoAsync(formatos, convocatoria.Id, "formatos");
                convocatoria.RutaFormatos = ruta;
                archivosNuevos.Add(ruta);
            }

            await _context.SaveChangesAsync();
            await transaction.CommitAsync();

            _logger.LogInformation("POST exitoso. ConvocatoriaId={Id}", convocatoria.Id);
            return CreatedAtAction(nameof(ObtenerPorId), new { id = convocatoria.Id }, MapToResponseDto(convocatoria));
        }
        catch (DbUpdateException ex)
            when (ex.InnerException is PostgresException pg && pg.SqlState == PostgresErrorCodes.UniqueViolation)
        {
            await transaction.RollbackAsync();
            _logger.LogWarning("Conflicto de clave duplicada detectado.");
            await CompensarArchivosAsync(archivosNuevos);
            return Conflict(new { mensaje = "Ya existe una convocatoria con esa clave." });
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            _logger.LogError(ex, "Error en POST /api/convocatorias");
            await CompensarArchivosAsync(archivosNuevos);
            throw;
        }
    }

    [HttpPut("{id}")]
    [Consumes("multipart/form-data")]
    [Authorize(Roles = "Administrador,Coordinador")]
    public async Task<IActionResult> Actualizar(int id, [FromForm] ActualizarConvocatoriaDto dto,
        IFormFile? basesPDF, IFormFile? convocatoriaPDF, IFormFile? formatos)
    {
        _logger.LogInformation("PUT /api/convocatorias/{Id} - Inicio actualizacion", id);

        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var existente = await _context.Convocatorias.FindAsync(id);
        if (existente is null)
            return NotFound(new { mensaje = "Convocatoria no encontrada." });

        var erroresFechas = ValidarFechas(dto, esCreacion: false);
        if (erroresFechas.Count > 0)
            return BadRequest(new { mensaje = "Error en las fechas.", errores = erroresFechas });

        var archivosNuevos = new List<string>();
        var rutasAnteriores = new List<string?>();

        try
        {
            ValidarArchivo(basesPDF, new[] { ".pdf" }, "bases");
            ValidarArchivo(convocatoriaPDF, new[] { ".pdf" }, "convocatoria");
            ValidarArchivo(formatos, new[] { ".pdf", ".doc", ".docx", ".xls", ".xlsx" }, "formatos");
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { mensaje = ex.Message });
        }

        await using var transaction = await _context.Database.BeginTransactionAsync();

        try
        {
            existente.Titulo = dto.Titulo;
            existente.TipoConvocatoria = dto.TipoConvocatoria;
            existente.Descripcion = dto.Descripcion;
            existente.Objetivo = dto.Objetivo;
            existente.FechaPublicacion = dto.FechaPublicacion;
            existente.FechaApertura = dto.FechaApertura;
            existente.FechaLimiteRegistro = dto.FechaLimiteRegistro;
            existente.FechaEvaluacion = dto.FechaEvaluacion;
            existente.FechaCierre = dto.FechaCierre;
            existente.FechaPublicacionResultados = dto.FechaPublicacionResultados;
            existente.Categorias = dto.Categorias;
            existente.Estado = dto.Estado;
            existente.NumeroMaximoProyectos = dto.NumeroMaximoProyectos;
            existente.NumeroMaximoIntegrantes = dto.NumeroMaximoIntegrantes;
            existente.NumeroEvaluadoresPorProyecto = dto.NumeroEvaluadoresPorProyecto;
            existente.EscalaEvaluacion = dto.EscalaEvaluacion;
            existente.RubricaAsignada = dto.RubricaAsignada;
            existente.LinkRubrica = dto.LinkRubrica;

            if (basesPDF != null)
            {
                var ruta = await _archivoService.GuardarArchivoAsync(basesPDF, existente.Id, "bases");
                rutasAnteriores.Add(existente.RutaBases);
                existente.RutaBases = ruta;
                archivosNuevos.Add(ruta);
            }
            if (convocatoriaPDF != null)
            {
                var ruta = await _archivoService.GuardarArchivoAsync(convocatoriaPDF, existente.Id, "convocatoria");
                rutasAnteriores.Add(existente.RutaConvocatoriaPDF);
                existente.RutaConvocatoriaPDF = ruta;
                archivosNuevos.Add(ruta);
            }
            if (formatos != null)
            {
                var ruta = await _archivoService.GuardarArchivoAsync(formatos, existente.Id, "formatos");
                rutasAnteriores.Add(existente.RutaFormatos);
                existente.RutaFormatos = ruta;
                archivosNuevos.Add(ruta);
            }

            await _context.SaveChangesAsync();
            await transaction.CommitAsync();

            // Eliminar archivos anteriores solo después de confirmar
            foreach (var ruta in rutasAnteriores)
            {
                if (!string.IsNullOrWhiteSpace(ruta) && !archivosNuevos.Contains(ruta))
                    await _archivoService.EliminarArchivoAsync(ruta);
            }

            _logger.LogInformation("PUT exitoso. ConvocatoriaId={Id}", existente.Id);
            return Ok(MapToResponseDto(existente));
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            _logger.LogError(ex, "Error en PUT /api/convocatorias/{Id}", id);
            await CompensarArchivosAsync(archivosNuevos);
            throw;
        }
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Administrador,Coordinador")]
    public async Task<IActionResult> Eliminar(int id)
    {
        var convocatoria = await _context.Convocatorias.FindAsync(id);
        if (convocatoria is null)
            return NotFound(new { mensaje = "Convocatoria no encontrada." });

        var tieneProyectos = await _context.Proyectos.AnyAsync(p => p.ConvocatoriaId == id);
        if (tieneProyectos)
            return BadRequest(new { mensaje = "No se puede eliminar la convocatoria porque tiene proyectos asociados. Primero elimine los proyectos." });

        var rutas = new[] { convocatoria.RutaBases, convocatoria.RutaConvocatoriaPDF, convocatoria.RutaFormatos };

        _context.Convocatorias.Remove(convocatoria);
        await _context.SaveChangesAsync();

        foreach (var ruta in rutas)
        {
            if (!string.IsNullOrWhiteSpace(ruta))
                await _archivoService.EliminarArchivoAsync(ruta);
        }

        return Ok(new { mensaje = "Convocatoria eliminada." });
    }

    [HttpGet("{id}/archivos/{tipo}")]
    [Authorize]
    public async Task<IActionResult> DescargarArchivoConvocatoria(int id, string tipo)
    {
        _logger.LogInformation("GET archivo. ConvocatoriaId={Id}, Tipo={Tipo}", id, tipo);

        var convocatoria = await _context.Convocatorias.FindAsync(id);
        if (convocatoria is null)
            return NotFound(new { mensaje = "Convocatoria no encontrada." });

        string? ruta = tipo.ToLowerInvariant() switch
        {
            "bases" => convocatoria.RutaBases,
            "convocatoria" => convocatoria.RutaConvocatoriaPDF,
            "formatos" => convocatoria.RutaFormatos,
            _ => null
        };

        if (string.IsNullOrWhiteSpace(ruta))
        {
            _logger.LogWarning("Ruta no registrada. ConvocatoriaId={Id}, Tipo={Tipo}", id, tipo);
            return NotFound(new { mensaje = "Archivo no encontrado." });
        }

        try
        {
            await using var stream = await _archivoService.ObtenerStreamAsync(ruta);
            var extension = Path.GetExtension(ruta).ToLowerInvariant();
            var contentType = extension switch
            {
                ".pdf" => "application/pdf",
                ".doc" or ".docx" => "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                ".xls" => "application/vnd.ms-excel",
                ".xlsx" => "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                _ => "application/octet-stream"
            };

            var inline = extension == ".pdf";
            var cd = inline ? "inline" : "attachment";

            _logger.LogInformation("Archivo servido. ConvocatoriaId={Id}, Tipo={Tipo}, Ruta={Ruta}", id, tipo, ruta);
            return new FileStreamResult(stream, contentType)
            {
                EnableRangeProcessing = true,
                FileDownloadName = inline ? null : Path.GetFileName(ruta)
            };
        }
        catch (FileNotFoundException)
        {
            _logger.LogWarning("Archivo no existe en disco. ConvocatoriaId={Id}, Tipo={Tipo}, Ruta={Ruta}", id, tipo, ruta);
            return NotFound(new { mensaje = "Archivo no encontrado." });
        }
    }

    private async Task CompensarArchivosAsync(List<string> archivosNuevos)
    {
        foreach (var ruta in archivosNuevos)
        {
            await _archivoService.EliminarArchivoAsync(ruta);
            _logger.LogInformation("Compensacion: archivo eliminado. Ruta={Ruta}", ruta);
        }
    }

    private async Task<string> GenerarClaveAsync()
    {
        var anio = DateTime.UtcNow.Year;

        var connection = _context.Database.GetDbConnection();
        if (connection.State != ConnectionState.Open)
            await connection.OpenAsync();

        await using var command = connection.CreateCommand();
        command.CommandText = @"
            INSERT INTO ""ConvocatoriaConsecutivos"" (""Anio"", ""UltimoNumero"")
            VALUES (@anio, 1)
            ON CONFLICT (""Anio"")
            DO UPDATE SET ""UltimoNumero"" = ""ConvocatoriaConsecutivos"".""UltimoNumero"" + 1
            RETURNING ""UltimoNumero"";
        ";

        var param = command.CreateParameter();
        param.ParameterName = "@anio";
        param.Value = anio;
        command.Parameters.Add(param);

        var result = await command.ExecuteScalarAsync();
        var numero = Convert.ToInt32(result!);

        return $"CONV-{anio}-{numero:D4}";
    }

    private static void ValidarArchivo(IFormFile? archivo, string[] extensionesPermitidas, string tipo)
    {
        if (archivo == null || archivo.Length == 0)
            return;

        var extension = Path.GetExtension(archivo.FileName).ToLowerInvariant();
        if (!extensionesPermitidas.Contains(extension))
            throw new InvalidOperationException($"El archivo de {tipo} tiene una extension no permitida.");

        if (archivo.Length > 10 * 1024 * 1024)
            throw new InvalidOperationException($"El archivo de {tipo} no debe exceder 10 MB.");
    }

    private static List<string> ValidarFechas(CrearConvocatoriaDto c, bool esCreacion)
    {
        var errores = new List<string>();
        var ahora = DateTime.UtcNow;

        if (c.FechaApertura == default)
            errores.Add("La fecha de apertura es obligatoria.");

        if (c.FechaCierre == default)
            errores.Add("La fecha de cierre es obligatoria.");

        if (esCreacion)
        {
            if (c.FechaLimiteRegistro != default && c.FechaLimiteRegistro < ahora)
                errores.Add("La fecha limite de registro no puede estar en el pasado.");

            if (c.FechaCierre != default && c.FechaCierre < ahora)
                errores.Add("La fecha de cierre no puede estar en el pasado.");
        }

        if (c.FechaApertura != default && c.FechaCierre != default && c.FechaApertura >= c.FechaCierre)
            errores.Add("La fecha de apertura debe ser anterior a la fecha de cierre.");

        if (c.FechaLimiteRegistro != default && c.FechaCierre != default && c.FechaLimiteRegistro >= c.FechaCierre)
            errores.Add("La fecha limite de registro debe ser anterior a la fecha de cierre.");

        if (c.FechaLimiteRegistro != default && c.FechaApertura != default && c.FechaLimiteRegistro < c.FechaApertura)
            errores.Add("La fecha limite de registro no puede ser anterior a la fecha de apertura.");

        if (c.FechaEvaluacion != default && c.FechaCierre != default && c.FechaEvaluacion <= c.FechaCierre)
            errores.Add("La fecha de evaluacion debe ser posterior a la fecha de cierre.");

        return errores;
    }

    private static List<string> ValidarFechas(ActualizarConvocatoriaDto c, bool esCreacion)
    {
        var errores = new List<string>();
        var ahora = DateTime.UtcNow;

        if (c.FechaApertura == default)
            errores.Add("La fecha de apertura es obligatoria.");

        if (c.FechaCierre == default)
            errores.Add("La fecha de cierre es obligatoria.");

        if (esCreacion)
        {
            if (c.FechaLimiteRegistro != default && c.FechaLimiteRegistro < ahora)
                errores.Add("La fecha limite de registro no puede estar en el pasado.");

            if (c.FechaCierre != default && c.FechaCierre < ahora)
                errores.Add("La fecha de cierre no puede estar en el pasado.");
        }

        if (c.FechaApertura != default && c.FechaCierre != default && c.FechaApertura >= c.FechaCierre)
            errores.Add("La fecha de apertura debe ser anterior a la fecha de cierre.");

        if (c.FechaLimiteRegistro != default && c.FechaCierre != default && c.FechaLimiteRegistro >= c.FechaCierre)
            errores.Add("La fecha limite de registro debe ser anterior a la fecha de cierre.");

        if (c.FechaLimiteRegistro != default && c.FechaApertura != default && c.FechaLimiteRegistro < c.FechaApertura)
            errores.Add("La fecha limite de registro no puede ser anterior a la fecha de apertura.");

        if (c.FechaEvaluacion != default && c.FechaCierre != default && c.FechaEvaluacion <= c.FechaCierre)
            errores.Add("La fecha de evaluacion debe ser posterior a la fecha de cierre.");

        return errores;
    }

    private static ConvocatoriaResponseDto MapToResponseDto(Convocatoria c) => new()
    {
        Id = c.Id,
        Clave = c.Clave,
        Titulo = c.Titulo,
        Descripcion = c.Descripcion,
        TipoConvocatoria = c.TipoConvocatoria,
        Objetivo = c.Objetivo,
        FechaPublicacion = c.FechaPublicacion,
        FechaApertura = c.FechaApertura,
        FechaLimiteRegistro = c.FechaLimiteRegistro,
        FechaEvaluacion = c.FechaEvaluacion,
        FechaCierre = c.FechaCierre,
        FechaPublicacionResultados = c.FechaPublicacionResultados,
        Categorias = c.Categorias,
        NumeroMaximoProyectos = c.NumeroMaximoProyectos,
        NumeroMaximoIntegrantes = c.NumeroMaximoIntegrantes,
        NumeroEvaluadoresPorProyecto = c.NumeroEvaluadoresPorProyecto,
        EscalaEvaluacion = c.EscalaEvaluacion,
        RubricaAsignada = c.RubricaAsignada,
        LinkRubrica = c.LinkRubrica,
        Estado = c.Estado,
        RutaBases = c.RutaBases,
        RutaConvocatoriaPDF = c.RutaConvocatoriaPDF,
        RutaFormatos = c.RutaFormatos
    };
}
