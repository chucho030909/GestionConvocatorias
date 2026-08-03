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
[Authorize(Roles = "Administrador")]
public class UsuariosController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly UserManager<Usuario> _userManager;

    public UsuariosController(AppDbContext context, UserManager<Usuario> userManager)
    {
        _context = context;
        _userManager = userManager;
    }

    // Administrador: listado global de usuarios
    [HttpGet]
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
                Activo = u.Activo
            })
            .ToListAsync();

        return Ok(usuarios);
    }

    // Administrador: crear usuario y asignar rol
    [HttpPost]
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
            return BadRequest(new { mensaje = "No se pudo crear el usuario.", errores = resultado.Errors.Select(e => e.Description) });

        await _userManager.AddToRoleAsync(usuario, dto.Rol);

        return Ok(new { mensaje = "Usuario creado exitosamente.", usuario.Id });
    }

    // Administrador: editar datos y rol, activar/inactivar
    [HttpPut("{id}")]
    public async Task<IActionResult> Editar(int id, [FromBody] EditarUsuarioDto dto)
    {
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
            return BadRequest(new { mensaje = "No se pudo actualizar el usuario.", errores = resultado.Errors.Select(e => e.Description) });

        var rolesActuales = await _userManager.GetRolesAsync(usuario);
        await _userManager.RemoveFromRolesAsync(usuario, rolesActuales);
        await _userManager.AddToRoleAsync(usuario, dto.Rol);

        return Ok(new { mensaje = "Usuario actualizado exitosamente." });
    }

    // Administrador: activar o inactivar cuenta
    [HttpPut("{id}/estado")]
    public async Task<IActionResult> CambiarEstado(int id, [FromBody] bool activo)
    {
        var usuario = await _userManager.FindByIdAsync(id.ToString());
        if (usuario is null)
            return NotFound(new { mensaje = "El usuario no existe." });

        usuario.Activo = activo;
        var resultado = await _userManager.UpdateAsync(usuario);
        if (!resultado.Succeeded)
            return BadRequest(new { mensaje = "No se pudo cambiar el estado del usuario." });

        return Ok(new { mensaje = activo ? "Usuario activado." : "Usuario inactivado." });
    }
}
