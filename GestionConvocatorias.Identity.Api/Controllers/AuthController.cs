using GestionConvocatorias.Identity.Api.Data;
using GestionConvocatorias.Identity.Api.DTOs;
using GestionConvocatorias.Identity.Api.Models;
using GestionConvocatorias.Identity.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Collections.Concurrent;
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
    private readonly IEmailService _emailService;
    private readonly IArchivoService _archivoService;

    // Rate limiting para login
    private static readonly ConcurrentDictionary<string, (int Intentos, DateTime UltimoIntento)> _loginAttempts = new();
    private const int MAX_INTENTOS = 20;
    private const int BLOQUEO_MINUTOS = 2;

    public AuthController(
        AppDbContext context,
        IConfiguration configuration,
        UserManager<Usuario> userManager,
        SignInManager<Usuario> signInManager,
        IEmailService emailService,
        IArchivoService archivoService)
    {
        _context = context;
        _configuration = configuration;
        _userManager = userManager;
        _signInManager = signInManager;
        _emailService = emailService;
        _archivoService = archivoService;
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

        // Solo permitir registro de estudiantes desde el endpoint público
        var rolPermitido = Roles.Estudiante;
        var usuario = new Usuario
        {
            UserName = correoNormalizado,
            Email = correoNormalizado,
            Nombres = dto.Nombres,
            Apellidos = dto.Apellidos,
            Rol = rolPermitido,
            Activo = true,
            FechaRegistro = DateTime.UtcNow
        };

        var resultado = await _userManager.CreateAsync(usuario, dto.Password);
        if (!resultado.Succeeded)
            return BadRequest(new RespuestaEstandarizada(false, "No se pudo crear el usuario.", new[] { "Error al crear la cuenta. Intente con otro correo." }));

        await _userManager.AddToRoleAsync(usuario, rolPermitido);

        return Ok(new RespuestaEstandarizada(true, "Usuario registrado exitosamente.", new { usuario.Id }));
    }

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<IActionResult> Login([FromBody] LoginDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(new RespuestaEstandarizada(false, "Datos inválidos", null));

        var correoNormalizado = dto.CorreoElectronico.Trim().ToLowerInvariant();

        // Rate limiting: verificar si la cuenta está bloqueada
        if (_loginAttempts.TryGetValue(correoNormalizado, out var intento))
        {
            if (intento.Intentos >= MAX_INTENTOS && (DateTime.UtcNow - intento.UltimoIntento).TotalMinutes < BLOQUEO_MINUTOS)
            {
                var minutosRestantes = BLOQUEO_MINUTOS - (int)(DateTime.UtcNow - intento.UltimoIntento).TotalMinutes;
                return StatusCode(429, new RespuestaEstandarizada(false, $"Demasiados intentos. Intente de nuevo en {minutosRestantes} minutos.", null));
            }
        }

        var usuario = await _userManager.FindByEmailAsync(correoNormalizado);

        if (usuario is null || !usuario.Activo || !await _userManager.CheckPasswordAsync(usuario, dto.Password))
        {
            // Registrar intento fallido
            _loginAttempts.AddOrUpdate(correoNormalizado,
                (1, DateTime.UtcNow),
                (key, val) => (val.Intentos + 1, DateTime.UtcNow));

            return Unauthorized(new RespuestaEstandarizada(false, "Correo o contraseña incorrectos.", null));
        }

        // Login exitoso: limpiar intentos
        _loginAttempts.TryRemove(correoNormalizado, out _);

        var token = await GenerarToken(usuario);

        return Ok(new RespuestaEstandarizada(true, "Inicio de sesión exitoso.", new { token }));
    }

    // ─── Registro de estudiantes con archivos ───
    [HttpPost("registrar-estudiante")]
    [AllowAnonymous]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> RegistrarEstudiante([FromForm] RegistroEstudianteDto dto,
        IFormFile? identificacionPDF,
        IFormFile? constanciaPDF,
        IFormFile? cartaCompromisoPDF)
    {
        var errores = new List<string>();

        if (string.IsNullOrWhiteSpace(dto.CorreoElectronico))
            errores.Add("El correo institucional es obligatorio.");
        if (string.IsNullOrWhiteSpace(dto.Password))
            errores.Add("La contraseña es obligatoria.");
        if (!string.IsNullOrWhiteSpace(dto.Password) && dto.Password.Length < 6)
            errores.Add("La contraseña debe tener al menos 6 caracteres.");
        if (!string.IsNullOrWhiteSpace(dto.Password) && !System.Text.RegularExpressions.Regex.IsMatch(dto.Password, @"[A-Za-z]"))
            errores.Add("La contraseña debe contener al menos una letra.");
        if (!string.IsNullOrWhiteSpace(dto.Password) && !System.Text.RegularExpressions.Regex.IsMatch(dto.Password, @"\d"))
            errores.Add("La contraseña debe contener al menos un número.");
        if (!string.IsNullOrWhiteSpace(dto.CorreoElectronico) && !dto.CorreoElectronico.Contains("@"))
            errores.Add("El correo institucional no tiene un formato válido.");
        if (string.IsNullOrWhiteSpace(dto.Nombres))
            errores.Add("El nombre(s) es obligatorio.");
        if (string.IsNullOrWhiteSpace(dto.ApellidoPaterno))
            errores.Add("El apellido paterno es obligatorio.");
        if (string.IsNullOrWhiteSpace(dto.Matricula))
            errores.Add("La matrícula es obligatoria.");
        if (string.IsNullOrWhiteSpace(dto.Universidad))
            errores.Add("La universidad es obligatoria.");
        if (string.IsNullOrWhiteSpace(dto.ProgramaEducativo))
            errores.Add("El programa educativo es obligatorio.");
        if (string.IsNullOrWhiteSpace(dto.Cuatrimestre))
            errores.Add("El cuatrimestre es obligatorio.");
        if (!dto.AceptaPrivacidad)
            errores.Add("Debes aceptar el aviso de privacidad.");

        if (errores.Any())
            return BadRequest(new RespuestaEstandarizada(false, "Validación fallida.", errores));

        if (!dto.AceptaPrivacidad)
            return BadRequest(new RespuestaEstandarizada(false, "Debes aceptar el aviso de privacidad.", null));

        var correoNormalizado = dto.CorreoElectronico.Trim().ToLowerInvariant();

        if (await _userManager.FindByEmailAsync(correoNormalizado) is not null)
            return Conflict(new RespuestaEstandarizada(false, "El correo institucional ya está registrado.", null));

        if (await _context.Usuarios.AnyAsync(u => u.Matricula == dto.Matricula && dto.Matricula != null))
            return Conflict(new RespuestaEstandarizada(false, "La matrícula ya está registrada.", null));

        // Validar PDF
        async Task<string?> GuardarPdf(IFormFile? file, string subcarpeta)
        {
            if (file == null || file.Length == 0) return null;
            if (file.ContentType != "application/pdf")
                throw new InvalidOperationException($"El archivo {file.FileName} no es un PDF.");
            return await _archivoService.GuardarArchivoAsync(file, subcarpeta);
        }

        string? rutaIdentificacion = null;
        string? rutaConstancia = null;
        string? rutaCartaCompromiso = null;

        try
        {
            rutaIdentificacion = await GuardarPdf(identificacionPDF, "identificaciones");
            rutaConstancia = await GuardarPdf(constanciaPDF, "constancias");
            rutaCartaCompromiso = await GuardarPdf(cartaCompromisoPDF, "cartas");
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new RespuestaEstandarizada(false, ex.Message, null));
        }

        var apellidos = string.Join(" ", new[] { dto.ApellidoPaterno, dto.ApellidoMaterno }.Where(a => !string.IsNullOrWhiteSpace(a)));

        var usuario = new Usuario
        {
            UserName = correoNormalizado,
            Email = correoNormalizado,
            Nombres = dto.Nombres,
            Apellidos = apellidos,
            ApellidoPaterno = dto.ApellidoPaterno,
            ApellidoMaterno = dto.ApellidoMaterno,
            FechaNacimiento = dto.FechaNacimiento,
            CorreoPersonal = dto.CorreoPersonal,
            TelefonoCelular = dto.TelefonoCelular,
            Matricula = dto.Matricula,
            Universidad = dto.Universidad,
            ProgramaEducativo = dto.ProgramaEducativo,
            Cuatrimestre = dto.Cuatrimestre,
            Grupo = dto.Grupo,
            PromedioGeneral = dto.PromedioGeneral,
            Modalidad = dto.Modalidad,
            RutaIdentificacion = rutaIdentificacion,
            RutaConstancia = rutaConstancia,
            RutaCartaCompromiso = rutaCartaCompromiso,
            Rol = Roles.Estudiante,
            Activo = true,
            FechaRegistro = DateTime.UtcNow
        };

        var resultado = await _userManager.CreateAsync(usuario, dto.Password);
        if (!resultado.Succeeded)
            return BadRequest(new RespuestaEstandarizada(false, "No se pudo crear el usuario. Verifique los datos e intente de nuevo.", null));

        await _userManager.AddToRoleAsync(usuario, Roles.Estudiante);

        return Ok(new RespuestaEstandarizada(true, "Estudiante registrado exitosamente.", new { usuario.Id }));
    }

    // ─── Registro de docentes ───
    [HttpPost("registrar-docente")]
    [AllowAnonymous]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> RegistrarDocente([FromForm] RegistroDocenteDto dto,
        IFormFile? cvPDF,
        IFormFile? identificacionPDF,
        IFormFile? cartaConfidencialidadPDF)
    {
        if (string.IsNullOrWhiteSpace(dto.CorreoElectronico))
            return BadRequest(new RespuestaEstandarizada(false, "El correo institucional es obligatorio.", null));
        if (string.IsNullOrWhiteSpace(dto.Password) || dto.Password.Length < 6)
            return BadRequest(new RespuestaEstandarizada(false, "La contraseña debe tener al menos 6 caracteres.", null));
        if (!System.Text.RegularExpressions.Regex.IsMatch(dto.Password, @"[A-Za-z]"))
            return BadRequest(new RespuestaEstandarizada(false, "La contraseña debe contener al menos una letra.", null));
        if (!System.Text.RegularExpressions.Regex.IsMatch(dto.Password, @"\d"))
            return BadRequest(new RespuestaEstandarizada(false, "La contraseña debe contener al menos un número.", null));
        if (string.IsNullOrWhiteSpace(dto.Nombres) || string.IsNullOrWhiteSpace(dto.Apellidos))
            return BadRequest(new RespuestaEstandarizada(false, "Nombre y apellidos son obligatorios.", null));

        var correoNormalizado = dto.CorreoElectronico.Trim().ToLowerInvariant();

        // Solo permitir correos institucionales para docentes
        if (!correoNormalizado.EndsWith("@uttt.edu.mx"))
            return BadRequest(new RespuestaEstandarizada(false, "Solo se permiten correos institucionales (@uttt.edu.mx) para registro de docentes.", null));

        if (await _userManager.FindByEmailAsync(correoNormalizado) is not null)
            return Conflict(new RespuestaEstandarizada(false, "El correo electrónico ya está registrado.", null));

        async Task<string?> GuardarPdf(IFormFile? file, string subcarpeta)
        {
            if (file == null || file.Length == 0) return null;
            if (file.ContentType != "application/pdf")
                throw new InvalidOperationException($"El archivo {file.FileName} no es un PDF.");
            if (file.Length > 10 * 1024 * 1024)
                throw new InvalidOperationException($"El archivo {file.FileName} no debe exceder 10 MB.");
            return await _archivoService.GuardarArchivoAsync(file, subcarpeta);
        }

        string? rutaCv = null, rutaIdent = null, rutaCarta = null;
        try
        {
            rutaCv = await GuardarPdf(cvPDF, "cvs");
            rutaIdent = await GuardarPdf(identificacionPDF, "identificaciones");
            rutaCarta = await GuardarPdf(cartaConfidencialidadPDF, "cartas");
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new RespuestaEstandarizada(false, ex.Message, null));
        }

        var usuario = new Usuario
        {
            UserName = correoNormalizado,
            Email = correoNormalizado,
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
            RutaCv = rutaCv,
            RutaIdentificacion = rutaIdent,
            RutaCartaConfidencialidad = rutaCarta,
            Rol = Roles.DocenteAsesor,
            Activo = true,
            FechaRegistro = DateTime.UtcNow
        };

        var resultado = await _userManager.CreateAsync(usuario, dto.Password);
        if (!resultado.Succeeded)
            return BadRequest(new RespuestaEstandarizada(false, "No se pudo crear el usuario. Verifique los datos e intente de nuevo.", null));

        await _userManager.AddToRoleAsync(usuario, Roles.DocenteAsesor);

        return Ok(new RespuestaEstandarizada(true, "Docente registrado exitosamente.", new { usuario.Id }));
    }

    // ─── Recuperar contraseña ───
    [HttpPost("recuperar-contrasena")]
    [AllowAnonymous]
    public async Task<IActionResult> RecuperarContrasena([FromBody] RecuperarContrasenaDto dto)
    {
        var correoNormalizado = dto.CorreoElectronico.Trim().ToLowerInvariant();
        var usuario = await _userManager.FindByEmailAsync(correoNormalizado);

        if (usuario == null)
            return Ok(new RespuestaEstandarizada(true, "Si el correo está registrado, se enviará un enlace de recuperación.", null));

        var token = Convert.ToBase64String(Guid.NewGuid().ToByteArray());
        usuario.ResetToken = token;
        usuario.ResetTokenExpiry = DateTime.UtcNow.AddHours(2);
        await _userManager.UpdateAsync(usuario);

        var baseUrl = _configuration["FrontendUrl"] ?? "http://localhost:5173";
        var enlace = $"{baseUrl}/restablecer-contrasena?token={token}";

        var asunto = "Recuperación de contraseña - ConvocaEval IA";
        var cuerpo = $@"
            <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;'>
                <h2 style='color: #1a1a2e;'>Restablece tu contraseña</h2>
                <p>Hola,</p>
                <p>Has solicitado restablecer tu contraseña. Haz clic en el siguiente enlace (válido por 2 horas):</p>
                <p style='text-align: center; margin: 20px 0;'>
                    <a href='{enlace}' style='background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;'>Restablecer Contraseña</a>
                </p>
                <p>Si no solicitaste este cambio, puedes ignorar este correo.</p>
                <p style='color: #6b7280; font-size: 12px; margin-top: 30px;'>ConvocaEval IA - Sistema de Gestión de Convocatorias</p>
            </div>";

        try
        {
            await _emailService.EnviarCorreoAsync(usuario.Email!, asunto, cuerpo);
        }
        catch
        {
            // No revelar si falló el envío
        }

        return Ok(new RespuestaEstandarizada(true, "Si el correo está registrado, se enviará un enlace de recuperación.", null));
    }

    // ─── Restablecer contraseña ───
    [HttpPost("restablecer-contrasena")]
    [AllowAnonymous]
    public async Task<IActionResult> RestablecerContrasena([FromBody] RestablecerContrasenaDto dto)
    {
        var usuario = await _context.Usuarios.FirstOrDefaultAsync(u => u.ResetToken == dto.Token);

        if (usuario is null)
            return BadRequest(new RespuestaEstandarizada(false, "El token de recuperación es inválido.", null));

        if (usuario.ResetTokenExpiry < DateTime.UtcNow)
            return BadRequest(new RespuestaEstandarizada(false, "El token de recuperación ha expirado.", null));

        await _userManager.RemovePasswordAsync(usuario);
        await _userManager.AddPasswordAsync(usuario, dto.NuevaContrasena);

        usuario.ResetToken = null;
        usuario.ResetTokenExpiry = null;
        await _userManager.UpdateAsync(usuario);

        return Ok(new RespuestaEstandarizada(true, "Contraseña restablecida exitosamente.", null));
    }

    [Authorize]
    [HttpPut("perfil")]
    public async Task<IActionResult> ActualizarPerfil([FromBody] ActualizarPerfilDto dto)
    {
        var usuario = await _userManager.GetUserAsync(User);
        if (usuario is null)
            return NotFound(new { mensaje = "Usuario no encontrado." });

        usuario.Nombres = dto.Nombres.Trim();
        usuario.Apellidos = dto.Apellidos.Trim();

        var resultado = await _userManager.UpdateAsync(usuario);
        if (!resultado.Succeeded)
            return BadRequest(new { mensaje = "No se pudo actualizar el perfil." });

        return Ok(new { mensaje = "Perfil actualizado correctamente." });
    }

    [Authorize]
    [HttpPut("cambiar-password")]
    public async Task<IActionResult> CambiarPassword([FromBody] CambiarPasswordDto dto)
    {
        var usuario = await _userManager.GetUserAsync(User);
        if (usuario is null)
            return NotFound(new { mensaje = "Usuario no encontrado." });

        var resultado = await _userManager.ChangePasswordAsync(usuario, dto.ContrasenaActual, dto.NuevaContrasena);
        if (!resultado.Succeeded)
        {
            var errores = resultado.Errors.Select(e => e.Description);
            return BadRequest(new { mensaje = "No se pudo cambiar la contraseña.", errores });
        }

        await _signInManager.RefreshSignInAsync(usuario);
        return Ok(new { mensaje = "Contraseña cambiada correctamente." });
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
            new Claim(ClaimTypes.Name, $"{usuario.Nombres} {usuario.Apellidos}")
        };

        if (!string.IsNullOrWhiteSpace(usuario.Rol))
        {
            foreach (var rol in usuario.Rol.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
                claims.Add(new Claim(ClaimTypes.Role, rol));
        }

        foreach (var rol in roles)
        {
            if (!claims.Any(c => c.Type == ClaimTypes.Role && c.Value == rol))
                claims.Add(new Claim(ClaimTypes.Role, rol));
        }

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
