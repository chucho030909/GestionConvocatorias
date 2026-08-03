using GestionConvocatorias.Identity.Api.Data;
using GestionConvocatorias.Identity.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace GestionConvocatorias.Identity.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CalendarioController : ControllerBase
{
    private readonly AppDbContext _context;

    public CalendarioController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> ObtenerTodos()
    {
        var eventos = await _context.EventosCalendario
            .OrderBy(e => e.FechaInicio)
            .ToListAsync();

        return Ok(eventos);
    }

    [HttpPost]
    [Authorize(Roles = "Administrador,Coordinador")]
    public async Task<IActionResult> Crear([FromBody] EventoCalendario evento)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        if (evento.FechaFin < evento.FechaInicio)
            return BadRequest(new { mensaje = "La fecha de fin no puede ser anterior a la fecha de inicio." });

        _context.EventosCalendario.Add(evento);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(ObtenerTodos), new { id = evento.Id }, evento);
    }
}
