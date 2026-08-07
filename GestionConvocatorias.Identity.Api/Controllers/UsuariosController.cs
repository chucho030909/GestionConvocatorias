using GestionConvocatorias.Identity.Api.Data;
using GestionConvocatorias.Identity.Api.DTOs;
using GestionConvocatorias.Identity.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Linq;

namespace GestionConvocatorias.Identity.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UsuariosController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly UserManager<Usuario> _userManager;

    public UsuariosController(AppDbContext context, UserManager<Usuario> userManager)
    {
        _context = context;
        _userManager = userManager;
    }

    // Administrador y Coordinador: listado global de usuarios
    [HttpGet]
    [Authorize(Roles = "Administrador,Coordinador")]
    public async Task<IActionResult> ObtenerTodos()
    {
        var usuarios = await _userManager.Users
            .Select(u => new UsuarioRespuestaDto
            {
                Id = u.Id,
                Nombres = u.Nombres,
                Apellidos = u.Apellidos,
                CorreoElectronico = u.Email ?? string.Empty,
                Rol = u.Rol,
                Roles = u.Rol != null ? u.Rol.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries).ToList() : new List<string>(),
                Activo = u.Activo
            })
            .ToListAsync();

        return Ok(usuarios);
    }

    // Administrador: crear usuario y asignar rol
    [HttpPost]
    [Authorize(Roles = "Administrador")]
    public async Task<IActionResult> Crear([FromBody] CrearUsuarioDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        if (!Roles.Todos.Contains(dto.Rol))
            return BadRequest(new { mensaje = "El rol especificado no es válido." });

        var correoNormalizado = dto.CorreoElectronico.Trim().ToLowerInvariant();
        if (await _userManager.FindByEmailAsync(correoNormalizado) is not null)
            return Conflict(new { mensaje = "El correo electrónico ya está registrado." });

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
            return BadRequest(new { mensaje = "No se pudo crear el usuario. Verifique los datos e intente de nuevo." });

        await _userManager.AddToRoleAsync(usuario, dto.Rol);

        return Ok(new { mensaje = "Usuario creado exitosamente.", usuario.Id });
    }

    // Administrador: editar datos y rol, activar/inactivar
    [HttpPut("{id}")]
    [Authorize(Roles = "Administrador")]
    public async Task<IActionResult> Editar(int id, [FromBody] EditarUsuarioDto dto)
    {
        var usuarioActual = await _userManager.GetUserAsync(User);
        if (usuarioActual != null && usuarioActual.Id == id)
            return BadRequest(new { mensaje = "No puedes editar tu propia cuenta desde este panel." });

        var usuario = await _userManager.FindByIdAsync(id.ToString());
        if (usuario is null)
            return NotFound(new { mensaje = "El usuario no existe." });

        if (!Roles.Todos.Contains(dto.Rol))
            return BadRequest(new { mensaje = "El rol especificado no es válido." });

        usuario.Nombres = dto.Nombres;
        usuario.Apellidos = dto.Apellidos;
        usuario.Email = dto.CorreoElectronico.Trim().ToLowerInvariant();
        usuario.UserName = usuario.Email;
        usuario.Email = usuario.Email;
        usuario.Rol = dto.Rol;
        usuario.Activo = dto.Activo;

        var resultado = await _userManager.UpdateAsync(usuario);
        if (!resultado.Succeeded)
            return BadRequest(new { mensaje = "No se pudo actualizar el usuario. Verifique los datos e intente de nuevo." });

        var rolesActuales = await _userManager.GetRolesAsync(usuario);
        await _userManager.RemoveFromRolesAsync(usuario, rolesActuales);
        await _userManager.AddToRoleAsync(usuario, dto.Rol);

        return Ok(new { mensaje = "Usuario actualizado exitosamente." });
    }

    // Administrador: activar o inactivar cuenta
    [HttpPut("{id}/estado")]
    [Authorize(Roles = "Administrador")]
    public async Task<IActionResult> CambiarEstado(int id, [FromBody] bool activo)
    {
        var usuarioActual = await _userManager.GetUserAsync(User);
        if (usuarioActual != null && usuarioActual.Id == id)
            return BadRequest(new { mensaje = "No puedes cambiar el estado de tu propia cuenta." });

        var usuario = await _userManager.FindByIdAsync(id.ToString());
        if (usuario is null)
            return NotFound(new { mensaje = "El usuario no existe." });

        usuario.Activo = activo;
        var resultado = await _userManager.UpdateAsync(usuario);
        if (!resultado.Succeeded)
            return BadRequest(new { mensaje = "No se pudo cambiar el estado del usuario." });

        return Ok(new { mensaje = activo ? "Usuario activado." : "Usuario inactivado." });
    }

    // Administrador: actualizar roles de un usuario
    [HttpPut("{id}/roles")]
    [Authorize(Roles = "Administrador")]
    public async Task<IActionResult> ActualizarRoles(int id, [FromBody] ActualizarRolesDto dto)
    {
        var usuario = await _userManager.FindByIdAsync(id.ToString());
        if (usuario is null)
            return NotFound(new { mensaje = "El usuario no existe." });

        if (dto.Roles == null || dto.Roles.Count == 0)
            return BadRequest(new { mensaje = "Debe asignar al menos un rol." });

        foreach (var rol in dto.Roles)
        {
            if (!Roles.Todos.Contains(rol))
                return BadRequest(new { mensaje = $"El rol '{rol}' no es válido." });
        }

        usuario.Rol = string.Join(",", dto.Roles);
        var resultado = await _userManager.UpdateAsync(usuario);
        if (!resultado.Succeeded)
            return BadRequest(new { mensaje = "No se pudieron actualizar los roles. Verifique los datos e intente de nuevo." });

        var rolesActuales = await _userManager.GetRolesAsync(usuario);
        await _userManager.RemoveFromRolesAsync(usuario, rolesActuales);
        foreach (var rol in dto.Roles)
            await _userManager.AddToRoleAsync(usuario, rol);

        return Ok(new { mensaje = "Roles actualizados exitosamente.", roles = dto.Roles });
    }

    [HttpPut("especialidades/{evaluadorId}")]
    [Authorize(Roles = "Coordinador,Administrador")]
    public async Task<IActionResult> ActualizarEspecialidades(int evaluadorId, [FromBody] ActualizarEspecialidadesDto dto)
    {
        var usuario = await _userManager.FindByIdAsync(evaluadorId.ToString());
        if (usuario is null)
            return NotFound(new { mensaje = "El usuario no existe." });

        usuario.Especialidades = dto.Especialidades;
        var resultado = await _userManager.UpdateAsync(usuario);
        if (!resultado.Succeeded)
            return BadRequest(new { mensaje = "No se pudieron actualizar las especialidades." });

        return Ok(new { mensaje = "Especialidades actualizadas exitosamente." });
    }
}
