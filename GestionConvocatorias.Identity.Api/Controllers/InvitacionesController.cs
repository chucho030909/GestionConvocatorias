using GestionConvocatorias.Identity.Api.Data;
using GestionConvocatorias.Identity.Api.Models;
using GestionConvocatorias.Identity.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace GestionConvocatorias.Identity.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class InvitacionesController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IEmailService _emailService;
    private readonly UserManager<Usuario> _userManager;
    private readonly IConfiguration _configuration;

    public InvitacionesController(
        AppDbContext context,
        IEmailService emailService,
        UserManager<Usuario> userManager,
        IConfiguration configuration)
    {
        _context = context;
        _emailService = emailService;
        _userManager = userManager;
        _configuration = configuration;
    }

    [HttpPost("enviar")]
    [Authorize(Roles = "Administrador")]
    public async Task<IActionResult> Enviar([FromBody] EnviarInvitacionDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var invitacionExistente = await _context.InvitacionesEvaluador
            .AnyAsync(i => i.Correo == dto.Correo && i.Estado == EstadoInvitacion.Pendiente);

        if (invitacionExistente)
            return BadRequest(new { mensaje = "Ya existe una invitación pendiente para este correo." });

        var token = Guid.NewGuid().ToString("N");
        var invitacion = new InvitacionEvaluador
        {
            Correo = dto.Correo.Trim().ToLowerInvariant(),
            Token = token,
            FechaCreacion = DateTime.UtcNow,
            FechaExpiracion = DateTime.UtcNow.AddDays(7),
            Estado = EstadoInvitacion.Pendiente
        };

        _context.InvitacionesEvaluador.Add(invitacion);
        await _context.SaveChangesAsync();

        var enlaceValidacion = $"{_configuration["FrontendUrl"]}/invitacion/aceptar?token={token}";

        var cuerpo = $@"
            <h2>Has sido invitado a ser Evaluador</h2>
            <p>Ha recibido esta invitación para unirse como evaluador en la plataforma de Gestión de Convocatorias.</p>
            <p>Haga clic en el siguiente enlace para aceptar o rechazar la invitación:</p>
            <p><a href='{enlaceValidacion}'>{enlaceValidacion}</a></p>
            <p>Este enlace expirará en 7 días.</p>
            <br/>
            <p>Si no solicitó esta invitación, ignore este correo.</p>";

        await _emailService.EnviarCorreoAsync(dto.Correo, "Invitación a ser Evaluador - Gestión de Convocatorias", cuerpo);

        return Ok(new { mensaje = "Invitación enviada exitosamente.", invitacion.Id });
    }

    [HttpGet("validar/{token}")]
    [AllowAnonymous]
    public async Task<IActionResult> Validar(string token)
    {
        var invitacion = await _context.InvitacionesEvaluador
            .FirstOrDefaultAsync(i => i.Token == token);

        if (invitacion is null)
            return NotFound(new { mensaje = "La invitación no existe." });

        if (invitacion.Estado != EstadoInvitacion.Pendiente)
            return BadRequest(new { mensaje = "La invitación ya ha sido procesada.", estado = invitacion.Estado.ToString() });

        if (invitacion.FechaExpiracion < DateTime.UtcNow)
            return BadRequest(new { mensaje = "La invitación ha expirado." });

        return Ok(new
        {
            invitacion.Correo,
            invitacion.FechaCreacion,
            invitacion.FechaExpiracion,
            estado = invitacion.Estado.ToString()
        });
    }

    [HttpPost("responder")]
    [AllowAnonymous]
    public async Task<IActionResult> Responder([FromBody] ResponderInvitacionDto dto)
    {
        var invitacion = await _context.InvitacionesEvaluador
            .FirstOrDefaultAsync(i => i.Token == dto.Token);

        if (invitacion is null)
            return NotFound(new { mensaje = "La invitación no existe." });

        if (invitacion.Estado != EstadoInvitacion.Pendiente)
            return BadRequest(new { mensaje = "La invitación ya ha sido procesada." });

        if (invitacion.FechaExpiracion < DateTime.UtcNow)
            return BadRequest(new { mensaje = "La invitación ha expirado." });

        if (dto.Aceptar)
        {
            invitacion.Estado = EstadoInvitacion.Aceptada;
            await _context.SaveChangesAsync();

            var contraseñaTemporal = $"Eval{DateTime.UtcNow:yyyyMMdd}!";

            var usuario = new Usuario
            {
                UserName = invitacion.Correo,
                Email = invitacion.Correo,
                EmailConfirmed = true,
                Nombres = "Evaluador",
                Apellidos = "Invitado",
                Rol = Roles.Evaluador,
                Activo = true,
                FechaRegistro = DateTime.UtcNow
            };

            var resultado = await _userManager.CreateAsync(usuario, contraseñaTemporal);
            if (!resultado.Succeeded)
            {
                var errores = string.Join(", ", resultado.Errors.Select(e => e.Description));
                return BadRequest(new { mensaje = "Error al crear el usuario.", errores });
            }

            await _userManager.AddToRoleAsync(usuario, Roles.Evaluador);

            var cuerpo = $@"
                <h2>Bienvenido como Evaluador</h2>
                <p>Su cuenta ha sido creada exitosamente.</p>
                <p><strong>Correo:</strong> {invitacion.Correo}</p>
                <p><strong>Contraseña temporal:</strong> {contraseñaTemporal}</p>
                <p>Por favor, cambie su contraseña después de iniciar sesión por primera vez.</p>";

            await _emailService.EnviarCorreoAsync(invitacion.Correo, "Cuenta Creada - Gestión de Convocatorias", cuerpo);

            return Ok(new { mensaje = "Invitación aceptada. Se ha enviado un correo con las credenciales." });
        }
        else
        {
            invitacion.Estado = EstadoInvitacion.Rechazada;
            await _context.SaveChangesAsync();

            return Ok(new { mensaje = "Invitación rechazada." });
        }
    }
}

public class EnviarInvitacionDto
{
    public string Correo { get; set; } = string.Empty;
}

public class ResponderInvitacionDto
{
    public string Token { get; set; } = string.Empty;
    public bool Aceptar { get; set; }
}
