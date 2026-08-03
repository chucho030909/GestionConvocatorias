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

    // Todos los roles autenticados pueden consultar convocatorias
    [HttpGet]
    public async Task<IActionResult> GetConvocatorias()
    {
        var convocatorias = await _context.Convocatorias.ToListAsync();
        return Ok(convocatorias);
    }

    // Administrador y Coordinador pueden crear convocatorias
    [HttpPost]
    [Authorize(Roles = "Administrador,Coordinador")]
    public async Task<IActionResult> CrearConvocatoria([FromBody] Convocatoria convocatoria)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        _context.Convocatorias.Add(convocatoria);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetConvocatorias), new { id = convocatoria.Id }, convocatoria);
    }
}
