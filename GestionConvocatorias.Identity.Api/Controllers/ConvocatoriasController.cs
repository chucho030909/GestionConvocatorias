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
        var esEstudiante = User.IsInRole("Estudiante");

        var query = _context.Convocatorias.AsQueryable();

        // Los estudiantes solo ven convocatorias activas y dentro de fecha
        if (esEstudiante)
        {
            query = query.Where(c => c.Estado == "Activa" &&
                (c.FechaLimiteRegistro == default || c.FechaLimiteRegistro >= DateTime.UtcNow) &&
                c.FechaCierre >= DateTime.UtcNow);
        }

        var convocatorias = await query.OrderByDescending(c => c.FechaApertura).ToListAsync();
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
    [Consumes("multipart/form-data")]
    [Authorize(Roles = "Administrador,Coordinador")]
    public async Task<IActionResult> Crear([FromForm] Convocatoria convocatoria,
        IFormFile? basesPDF, IFormFile? convocatoriaPDF, IFormFile? formatos)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var erroresFechas = ValidarFechas(convocatoria, esCreacion: true);
        if (erroresFechas.Count > 0)
            return BadRequest(new { mensaje = "Error en las fechas.", errores = erroresFechas });

        var rutas = await GuardarArchivosConvocatoria(basesPDF, convocatoriaPDF, formatos);
        convocatoria.RutaBases = rutas.rutaBases;
        convocatoria.RutaConvocatoriaPDF = rutas.rutaConvocatoria;
        convocatoria.RutaFormatos = rutas.rutaFormatos;

        _context.Convocatorias.Add(convocatoria);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(ObtenerPorId), new { id = convocatoria.Id }, convocatoria);
    }

    [HttpPut("{id}")]
    [Consumes("multipart/form-data")]
    [Authorize(Roles = "Administrador,Coordinador")]
    public async Task<IActionResult> Actualizar(int id, [FromForm] Convocatoria convocatoria,
        IFormFile? basesPDF, IFormFile? convocatoriaPDF, IFormFile? formatos)
    {
        var existente = await _context.Convocatorias.FindAsync(id);
        if (existente is null)
            return NotFound(new { mensaje = "Convocatoria no encontrada." });

        var erroresFechas = ValidarFechas(convocatoria, esCreacion: false);
        if (erroresFechas.Count > 0)
            return BadRequest(new { mensaje = "Error en las fechas.", errores = erroresFechas });

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
        existente.LinkRubrica = convocatoria.LinkRubrica;

        var rutas = await GuardarArchivosConvocatoria(basesPDF, convocatoriaPDF, formatos);
        if (rutas.rutaBases != null) existente.RutaBases = rutas.rutaBases;
        if (rutas.rutaConvocatoria != null) existente.RutaConvocatoriaPDF = rutas.rutaConvocatoria;
        if (rutas.rutaFormatos != null) existente.RutaFormatos = rutas.rutaFormatos;

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

        // Verificar si hay proyectos asociados
        var tieneProyectos = await _context.Proyectos.AnyAsync(p => p.ConvocatoriaId == id);
        if (tieneProyectos)
            return BadRequest(new { mensaje = "No se puede eliminar la convocatoria porque tiene proyectos asociados. Primero elimine los proyectos." });

        _context.Convocatorias.Remove(convocatoria);
        await _context.SaveChangesAsync();
        return Ok(new { mensaje = "Convocatoria eliminada." });
    }

    private static List<string> ValidarFechas(Convocatoria c, bool esCreacion)
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
                errores.Add("La fecha límite de registro no puede estar en el pasado.");

            if (c.FechaCierre != default && c.FechaCierre < ahora)
                errores.Add("La fecha de cierre no puede estar en el pasado.");
        }

        if (c.FechaApertura != default && c.FechaCierre != default && c.FechaApertura >= c.FechaCierre)
            errores.Add("La fecha de apertura debe ser anterior a la fecha de cierre.");

        if (c.FechaLimiteRegistro != default && c.FechaCierre != default && c.FechaLimiteRegistro >= c.FechaCierre)
            errores.Add("La fecha límite de registro debe ser anterior a la fecha de cierre.");

        if (c.FechaLimiteRegistro != default && c.FechaApertura != default && c.FechaLimiteRegistro < c.FechaApertura)
            errores.Add("La fecha límite de registro no puede ser anterior a la fecha de apertura.");

        if (c.FechaEvaluacion != default && c.FechaCierre != default && c.FechaEvaluacion <= c.FechaCierre)
            errores.Add("La fecha de evaluación debe ser posterior a la fecha de cierre.");

        return errores;
    }

    private async Task<(string? rutaBases, string? rutaConvocatoria, string? rutaFormatos)> GuardarArchivosConvocatoria(
        IFormFile? basesPDF, IFormFile? convocatoriaPDF, IFormFile? formatos)
    {
        string? rutaBases = null, rutaConvocatoria = null, rutaFormatos = null;
        var carpeta = Path.Combine(Directory.Exists("/app/ArchivosGuardados") ? "/app/ArchivosGuardados" : AppContext.BaseDirectory, "ArchivosConvocatorias");
        Directory.CreateDirectory(carpeta);

        // Validar y guardar bases PDF
        if (basesPDF is { Length: > 0 })
        {
            if (!basesPDF.FileName.EndsWith(".pdf", StringComparison.OrdinalIgnoreCase))
                throw new InvalidOperationException("El archivo de bases debe ser un PDF.");
            if (basesPDF.Length > 10 * 1024 * 1024)
                throw new InvalidOperationException("El archivo de bases no debe exceder 10 MB.");

            var nombre = $"bases_{DateTime.UtcNow:yyyyMMddHHmmss}.pdf";
            var ruta = Path.Combine(carpeta, nombre);
            using var stream = new FileStream(ruta, FileMode.Create);
            await basesPDF.CopyToAsync(stream);
            rutaBases = ruta;
        }

        // Validar y guardar convocatoria PDF
        if (convocatoriaPDF is { Length: > 0 })
        {
            if (!convocatoriaPDF.FileName.EndsWith(".pdf", StringComparison.OrdinalIgnoreCase))
                throw new InvalidOperationException("El archivo de convocatoria debe ser un PDF.");
            if (convocatoriaPDF.Length > 10 * 1024 * 1024)
                throw new InvalidOperationException("El archivo de convocatoria no debe exceder 10 MB.");

            var nombre = $"convocatoria_{DateTime.UtcNow:yyyyMMddHHmmss}.pdf";
            var ruta = Path.Combine(carpeta, nombre);
            using var stream = new FileStream(ruta, FileMode.Create);
            await convocatoriaPDF.CopyToAsync(stream);
            rutaConvocatoria = ruta;
        }

        // Validar y guardar formatos
        if (formatos is { Length: > 0 })
        {
            var extension = Path.GetExtension(formatos.FileName).ToLowerInvariant();
            var extensionesPermitidas = new[] { ".pdf", ".doc", ".docx", ".xls", ".xlsx" };
            if (!extensionesPermitidas.Contains(extension))
                throw new InvalidOperationException("Los formatos deben ser PDF, Word o Excel.");
            if (formatos.Length > 10 * 1024 * 1024)
                throw new InvalidOperationException("El archivo de formatos no debe exceder 10 MB.");

            var nombre = $"formatos_{DateTime.UtcNow:yyyyMMddHHmmss}{extension}";
            var ruta = Path.Combine(carpeta, nombre);
            using var stream = new FileStream(ruta, FileMode.Create);
            await formatos.CopyToAsync(stream);
            rutaFormatos = ruta;
        }

        return (rutaBases, rutaConvocatoria, rutaFormatos);
    }

    [HttpGet("{id}/archivos/{tipo}")]
    [Authorize]
    public async Task<IActionResult> DescargarArchivoConvocatoria(int id, string tipo)
    {
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

        if (string.IsNullOrEmpty(ruta) || !System.IO.File.Exists(ruta))
            return NotFound(new { mensaje = "Archivo no encontrado." });

        var extension = Path.GetExtension(ruta).ToLowerInvariant();
        var contentType = extension switch
        {
            ".pdf" => "application/pdf",
            ".doc" or ".docx" => "application/msword",
            ".xls" or ".xlsx" => "application/vnd.ms-excel",
            _ => "application/octet-stream"
        };

        var bytes = await System.IO.File.ReadAllBytesAsync(ruta);
        return File(bytes, contentType, Path.GetFileName(ruta));
    }
}
