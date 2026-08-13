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
    private readonly UserManager<Usuario> _userManager;
    private readonly IEmailService _emailService;
    private readonly IConfiguration _config;

    public InvitacionesController(
        AppDbContext context,
        UserManager<Usuario> userManager,
        IEmailService emailService,
        IConfiguration config)
    {
        _context = context;
        _userManager = userManager;
        _emailService = emailService;
        _config = config;
    }

    [HttpPost]
    [Authorize(Roles = "Administrador,Coordinador")]
    public async Task<IActionResult> Crear([FromBody] CrearInvitacionDto dto)
    {
        var proyecto = await _context.Proyectos.FindAsync(dto.ProyectoId);
        if (proyecto is null)
            return NotFound(new { mensaje = "El proyecto no existe." });

        var token = Guid.NewGuid().ToString("N") + Guid.NewGuid().ToString("N").Substring(0, 16);

        var invitacion = new InvitacionEvaluador
        {
            Correo = dto.CorreoElectronico,
            Token = token,
            Rol = dto.Rol,
            ProyectoId = dto.ProyectoId,
            NombreCompleto = dto.NombreCompleto,
            FechaExpiracion = DateTime.UtcNow.AddDays(7),
            Estado = EstadoInvitacion.Pendiente
        };

        _context.InvitacionesEvaluador.Add(invitacion);
        await _context.SaveChangesAsync();

        var frontendUrl = _config["FrontendUrl"] ?? "http://localhost:5173";
        var urlAceptacion = $"{frontendUrl}/aceptar-invitacion?token={token}";

        var asunto = $"Invitación a evaluar proyecto: {proyecto.Titulo}";
        var cuerpo = $@"
            <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;'>
                <h2 style='color: #1a1a2e;'>ConvocaEval IA - Invitación de Evaluación</h2>
                <p>Hola <strong>{dto.NombreCompleto ?? dto.CorreoElectronico}</strong>,</p>
                <p>Has sido invitado(a) como <strong>{dto.Rol}</strong> del siguiente proyecto:</p>
                <div style='background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 15px 0;'>
                    <p><strong>Folio:</strong> {proyecto.Folio}</p>
                    <p><strong>Título:</strong> {proyecto.Titulo}</p>
                    <p><strong>Categoría:</strong> {proyecto.Categoria}</p>
                </div>
                <p>Para aceptar la invitación y unirte como evaluador, haz clic en el botón:</p>
                <div style='text-align: center; margin: 30px 0;'>
                    <a href='{urlAceptacion}' style='background-color: #7c3aed; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;'>Aceptar Invitación</a>
                </div>
                <p style='color: #6b7280; font-size: 13px;'>Este enlace expira en 7 días.</p>
                <p style='color: #6b7280; font-size: 12px; margin-top: 30px;'>Este es un correo generado automáticamente por ConvocaEval IA.</p>
            </div>";

        await _emailService.EnviarCorreoAsync(dto.CorreoElectronico, asunto, cuerpo);

        return Ok(new { mensaje = "Invitación enviada exitosamente.", invitacionId = invitacion.Id });
    }

    [HttpGet("aceptar/{token}")]
    [AllowAnonymous]
    public async Task<IActionResult> Aceptar(string token)
    {
        var frontendUrl = _config["FrontendUrl"] ?? "http://localhost:5173";

        var invitacion = await _context.InvitacionesEvaluador
            .FirstOrDefaultAsync(i => i.Token == token);

        if (invitacion is null)
            return Redirect($"{frontendUrl}/aceptar-invitacion?error=token_invalido");

        if (invitacion.Estado != EstadoInvitacion.Pendiente)
            return Redirect($"{frontendUrl}/aceptar-invitacion?error=ya_aceptada");

        if (invitacion.FechaExpiracion < DateTime.UtcNow)
        {
            invitacion.Estado = EstadoInvitacion.Expirada;
            await _context.SaveChangesAsync();
            return Redirect($"{frontendUrl}/aceptar-invitacion?error=token_expirado");
        }

        return Redirect($"{frontendUrl}/aceptar-invitacion?token={token}&correo={invitacion.Correo}");
    }

    [HttpPost("aceptar")]
    [AllowAnonymous]
    public async Task<IActionResult> AceptarInvitacion([FromBody] AceptarInvitacionDto dto)
    {
        var invitacion = await _context.InvitacionesEvaluador
            .FirstOrDefaultAsync(i => i.Token == dto.Token);

        if (invitacion is null)
            return BadRequest(new { mensaje = "Token de invitación no válido." });

        if (invitacion.Estado != EstadoInvitacion.Pendiente)
            return BadRequest(new { mensaje = "Esta invitación ya fue procesada." });

        if (invitacion.FechaExpiracion < DateTime.UtcNow)
            return BadRequest(new { mensaje = "La invitación ha expirado." });

        if (string.IsNullOrWhiteSpace(dto.Password) || dto.Password.Length < 6)
            return BadRequest(new { mensaje = "La contraseña debe tener al menos 6 caracteres." });

        if (!System.Text.RegularExpressions.Regex.IsMatch(dto.Password, @"[A-Za-z]"))
            return BadRequest(new { mensaje = "La contraseña debe contener al menos una letra." });

        if (!System.Text.RegularExpressions.Regex.IsMatch(dto.Password, @"\d"))
            return BadRequest(new { mensaje = "La contraseña debe contener al menos un número." });

        if (string.IsNullOrWhiteSpace(dto.Nombres) || string.IsNullOrWhiteSpace(dto.Apellidos))
            return BadRequest(new { mensaje = "Nombre y apellidos son obligatorios." });

        var usuario = await _userManager.FindByEmailAsync(invitacion.Correo);
        if (usuario is not null)
        {
            var rolesActuales = usuario.Rol?.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries).ToList() ?? new List<string>();
            if (!rolesActuales.Contains(invitacion.Rol))
            {
                rolesActuales.Add(invitacion.Rol);
                usuario.Rol = string.Join(",", rolesActuales);
                await _userManager.UpdateAsync(usuario);
                await _userManager.AddToRoleAsync(usuario, invitacion.Rol);
            }
            invitacion.Estado = EstadoInvitacion.Aceptada;
            invitacion.FechaAceptacion = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            return Ok(new { mensaje = "Rol asignado correctamente. Ya puedes iniciar sesión." });
        }

        usuario = new Usuario
        {
            UserName = invitacion.Correo,
            Email = invitacion.Correo,
            Nombres = dto.Nombres,
            Apellidos = dto.Apellidos,
            TelefonoCelular = dto.Telefono,
            GradoAcademico = dto.GradoAcademico,
            Profesion = dto.Profesion,
            Especialidades = dto.Especialidad,
            InstitucionProcedencia = dto.InstitucionProcedencia,
            CargoActual = dto.CargoActual,
            AnosExperiencia = dto.AnosExperiencia,
            LineasInvestigacion = dto.LineasInvestigacion,
            AreasEspecializacion = dto.AreasEspecializacion,
            Publicaciones = dto.Publicaciones,
            Certificaciones = dto.Certificaciones,
            Rol = invitacion.Rol,
            Activo = true,
            FechaRegistro = DateTime.UtcNow
        };

        var resultado = await _userManager.CreateAsync(usuario, dto.Password);
        if (!resultado.Succeeded)
            return BadRequest(new { mensaje = "No se pudo crear la cuenta. Verifique los datos e intente de nuevo." });

        await _userManager.AddToRoleAsync(usuario, invitacion.Rol);

        invitacion.Estado = EstadoInvitacion.Aceptada;
        invitacion.FechaAceptacion = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return Ok(new { mensaje = "Cuenta creada exitosamente. Ya puedes iniciar sesión." });
    }
}

public class CrearInvitacionDto
{
    public string CorreoElectronico { get; set; } = string.Empty;
    public string Rol { get; set; } = "Evaluador";
    public int ProyectoId { get; set; }
    public string? NombreCompleto { get; set; }
}

public class AceptarInvitacionDto
{
    public string Token { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string Nombres { get; set; } = string.Empty;
    public string Apellidos { get; set; } = string.Empty;
    public string? Telefono { get; set; }
    public string? GradoAcademico { get; set; }
    public string? Profesion { get; set; }
    public string? Especialidad { get; set; }
    public string? InstitucionProcedencia { get; set; }
    public string? CargoActual { get; set; }
    public int? AnosExperiencia { get; set; }
    public string? LineasInvestigacion { get; set; }
    public string? AreasEspecializacion { get; set; }
    public string? Publicaciones { get; set; }
    public string? Certificaciones { get; set; }
}
