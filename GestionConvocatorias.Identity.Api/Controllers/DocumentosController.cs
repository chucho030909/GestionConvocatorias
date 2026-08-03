using GestionConvocatorias.Identity.Api.Data;
using GestionConvocatorias.Identity.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace GestionConvocatorias.Identity.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DocumentosController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IWebHostEnvironment _env;

    public DocumentosController(AppDbContext context, IWebHostEnvironment env)
    {
        _context = context;
        _env = env;
    }

    private int UsuarioId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpPost("subir")]
    [Authorize(Roles = "Estudiante")]
    public async Task<IActionResult> Subir([FromForm] int proyectoId, [FromForm] IFormFile archivo)
    {
        if (archivo is null || archivo.Length == 0)
            return BadRequest(new { mensaje = "No se recibió ningún archivo." });

        var extension = Path.GetExtension(archivo.FileName).ToLowerInvariant();
        if (extension != ".pdf")
            return BadRequest(new { mensaje = "Solo se permiten archivos en formato .pdf." });

        const long tamanoMaximo = 20 * 1024 * 1024;
        if (archivo.Length > tamanoMaximo)
            return BadRequest(new { mensaje = "El archivo excede el tamaño máximo permitido de 20 MB." });

        var esIntegrante = await _context.ProyectoEstudiantes
            .AnyAsync(pe => pe.ProyectoId == proyectoId && pe.UsuarioId == UsuarioId);

        if (!esIntegrante)
            return NotFound(new { mensaje = "El proyecto no existe o no eres integrante del mismo." });

        var documentoExistente = await _context.Documentos
            .Where(d => d.ProyectoId == proyectoId && d.Tipo == archivo.ContentType)
            .OrderByDescending(d => d.Version)
            .FirstOrDefaultAsync();

        int nuevaVersion = 1;
        int? documentoPrevioId = null;

        if (documentoExistente != null)
        {
            nuevaVersion = documentoExistente.Version + 1;
            documentoPrevioId = documentoExistente.Id;
        }

        var carpetaDestino = Path.Combine(_env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot"), "uploads", "documentos");
        Directory.CreateDirectory(carpetaDestino);

        var nombreUnico = $"{Guid.NewGuid()}{Path.GetExtension(archivo.FileName)}";
        var rutaFisica = Path.Combine(carpetaDestino, nombreUnico);

        using (var stream = new FileStream(rutaFisica, FileMode.Create))
        {
            await archivo.CopyToAsync(stream);
        }

        var documento = new Documento
        {
            ProyectoId = proyectoId,
            NombreArchivo = archivo.FileName,
            RutaUbicacion = Path.Combine("uploads", "documentos", nombreUnico).Replace("\\", "/"),
            Tipo = archivo.ContentType,
            Version = nuevaVersion,
            DocumentoPrevioId = documentoPrevioId,
            FechaSubida = DateTime.UtcNow
        };

        _context.Documentos.Add(documento);
        await _context.SaveChangesAsync();

        return Ok(new { mensaje = "Documento subido exitosamente.", documento.Id,Version = documento.Version });
    }

    [HttpGet("descargar/{id}")]
    [Authorize(Roles = "Estudiante,DocenteAsesor,Coordinador,Administrador,Evaluador")]
    public async Task<IActionResult> Descargar(int id)
    {
        var documento = await _context.Documentos.FindAsync(id);
        if (documento is null)
            return NotFound(new { mensaje = "El documento no existe." });

        var rutaCompleta = Path.Combine(_env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot"), documento.RutaUbicacion);

        if (!System.IO.File.Exists(rutaCompleta))
            return NotFound(new { mensaje = "El archivo no se encuentra en el servidor." });

        var stream = System.IO.File.OpenRead(rutaCompleta);
        return File(stream, "application/pdf", documento.NombreArchivo);
    }
}
