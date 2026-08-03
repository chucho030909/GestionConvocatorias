using GestionConvocatorias.Identity.Api.Data;
using GestionConvocatorias.Identity.Api.DTOs;
using GestionConvocatorias.Identity.Api.Models;
using GestionConvocatorias.Identity.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Security.Claims;
using System.Text;

namespace GestionConvocatorias.Identity.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IConfiguration _configuration;
    private readonly UserManager<Usuario> _userManager;
    private readonly SignInManager<Usuario> _signInManager;

    public AuthController(
        AppDbContext context,
        IConfiguration configuration,
        UserManager<Usuario> userManager,
        SignInManager<Usuario> signInManager)
    {
        _context = context;
        _configuration = configuration;
        _userManager = userManager;
        _signInManager = signInManager;
    }

    [HttpPost("registrar")]
    [AllowAnonymous]
    public async Task<IActionResult> Registrar([FromBody] RegistroDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(new RespuestaEstandarizada(false, "Datos inválidos", ModelState.Values.SelectMany(v => v.Errors.Select(e => e.ErrorMessage))));

        var correoNormalizado = dto.CorreoElectronico.Trim().ToLowerInvariant();
        if (await _userManager.FindByEmailAsync(correoNormalizado) is not null)
            return Conflict(new RespuestaEstandarizada(false, "El correo electrónico ya está registrado.", null));

        if (!Roles.Todos.Contains(dto.Rol))
            return BadRequest(new RespuestaEstandarizada(false, "El rol especificado no es válido.", null));

        var usuario = new Usuario
        {
            UserName = correoNormalizado,
            Email = correoNormalizado,
            Nombres = dto.Nombres,
            Apellidos = dto.Apellidos,
            Rol = dto.Rol,
            Activo = true,
            FechaRegistro = DateTime.UtcNow
        };

        var resultado = await _userManager.CreateAsync(usuario, dto.Password);
        if (!resultado.Succeeded)
            return BadRequest(new RespuestaEstandarizada(false, "No se pudo crear el usuario.", resultado.Errors.Select(e => e.Description)));

        await _userManager.AddToRoleAsync(usuario, dto.Rol);

        return Ok(new RespuestaEstandarizada(true, "Usuario registrado exitosamente.", new { usuario.Id }));
    }

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<IActionResult> Login([FromBody] LoginDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(new RespuestaEstandarizada(false, "Datos inválidos", null));

        var correoNormalizado = dto.CorreoElectronico.Trim().ToLowerInvariant();
        var usuario = await _userManager.FindByEmailAsync(correoNormalizado);

        if (usuario is null || !usuario.Activo || !await _userManager.CheckPasswordAsync(usuario, dto.Password))
            return Unauthorized(new RespuestaEstandarizada(false, "Correo o contraseña incorrectos.", null));

        var token = await GenerarToken(usuario);

        return Ok(new RespuestaEstandarizada(true, "Inicio de sesión exitoso.", new { token }));
    }

    private async Task<string> GenerarToken(Usuario usuario)
    {
        var key = _configuration["Jwt:Key"] ?? throw new InvalidOperationException("Falta la configuración Jwt:Key");
        var issuer = _configuration["Jwt:Issuer"] ?? throw new InvalidOperationException("Falta la configuración Jwt:Issuer");
        var audience = _configuration["Jwt:Audience"] ?? throw new InvalidOperationException("Falta la configuración Jwt:Audience");
        var expiracionMinutos = _configuration.GetValue<int>("Jwt:ExpiracionMinutos", 60);

        var roles = await _userManager.GetRolesAsync(usuario);

        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, usuario.Id.ToString()),
            new Claim(ClaimTypes.Email, usuario.Email ?? string.Empty),
            new Claim(ClaimTypes.Name, $"{usuario.Nombres} {usuario.Apellidos}"),
            new Claim(ClaimTypes.Role, usuario.Rol)
        };

        foreach (var rol in roles)
            claims.Add(new Claim(ClaimTypes.Role, rol));

        var creds = new SigningCredentials(
            new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key)),
            SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(expiracionMinutos),
            signingCredentials: creds);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}

public record RespuestaEstandarizada(bool Exito, string Mensaje, object? Datos);
