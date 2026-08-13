using System.ComponentModel.DataAnnotations;

namespace GestionConvocatorias.Identity.Api.DTOs;

public class ActualizarPerfilDto
{
    [Required(ErrorMessage = "Los nombres son obligatorios.")]
    [StringLength(100)]
    public string Nombres { get; set; } = string.Empty;

    [Required(ErrorMessage = "Los apellidos son obligatorios.")]
    [StringLength(100)]
    public string Apellidos { get; set; } = string.Empty;

    [StringLength(20)]
    public string? Telefono { get; set; }
}

public class CambiarPasswordDto
{
    [Required(ErrorMessage = "La contraseña actual es obligatoria.")]
    public string ContrasenaActual { get; set; } = string.Empty;

    [Required(ErrorMessage = "La nueva contraseña es obligatoria.")]
    [StringLength(100, MinimumLength = 8, ErrorMessage = "La contraseña debe tener al menos 8 caracteres.")]
    public string NuevaContrasena { get; set; } = string.Empty;

    [Required(ErrorMessage = "La confirmación de contraseña es obligatoria.")]
    [Compare("NuevaContrasena", ErrorMessage = "Las contraseñas no coinciden.")]
    public string ConfirmarContrasena { get; set; } = string.Empty;
}
