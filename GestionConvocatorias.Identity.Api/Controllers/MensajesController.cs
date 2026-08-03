using GestionConvocatorias.Identity.Api.Data;
using GestionConvocatorias.Identity.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace GestionConvocatorias.Identity.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class MensajesController : ControllerBase
{
    private readonly AppDbContext _context;

    public MensajesController(AppDbContext context)
    {
        _context = context;
    }

    private int UsuarioId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpPost("enviar")]
    public async Task<IActionResult> Enviar([FromBody] EnviarMensajeDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var receptorExiste = await _context.Usuarios.AnyAsync(u => u.Id == dto.ReceptorId);
        if (!receptorExiste)
            return NotFound(new { mensaje = "El usuario receptor no existe." });

        if (dto.ReceptorId == UsuarioId)
            return BadRequest(new { mensaje = "No puedes enviarte mensajes a ti mismo." });

        var mensaje = new Mensaje
        {
            EmisorId = UsuarioId,
            ReceptorId = dto.ReceptorId,
            Contenido = dto.Contenido,
            FechaEnvio = DateTime.UtcNow,
            Leido = false
        };

        _context.Mensajes.Add(mensaje);
        await _context.SaveChangesAsync();

        return Ok(new { mensaje = "Mensaje enviado exitosamente.", mensaje.Id });
    }

    [HttpGet("conversacion/{otroUsuarioId}")]
    public async Task<IActionResult> ObtenerConversacion(int otroUsuarioId)
    {
        var conversacion = await _context.Mensajes
            .Where(m =>
                (m.EmisorId == UsuarioId && m.ReceptorId == otroUsuarioId) ||
                (m.EmisorId == otroUsuarioId && m.ReceptorId == UsuarioId))
            .Include(m => m.Emisor)
            .Include(m => m.Receptor)
            .OrderBy(m => m.FechaEnvio)
            .ToListAsync();

        var mensajesNoLeidos = await _context.Mensajes
            .Where(m => m.EmisorId == otroUsuarioId && m.ReceptorId == UsuarioId && !m.Leido)
            .ToListAsync();

        foreach (var mensaje in mensajesNoLeidos)
        {
            mensaje.Leido = true;
        }

        await _context.SaveChangesAsync();

        return Ok(conversacion);
    }
}

public class EnviarMensajeDto
{
    public int ReceptorId { get; set; }
    public string Contenido { get; set; } = string.Empty;
}
