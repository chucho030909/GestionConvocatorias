using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Identity;

namespace GestionConvocatorias.Identity.Api.Models;

public class Usuario : IdentityUser<int>
{
    [Required]
    [StringLength(100)]
    public string Nombres { get; set; } = string.Empty;

    [Required]
    [StringLength(100)]
    public string Apellidos { get; set; } = string.Empty;

    [Required]
    [StringLength(30)]
    public string Rol { get; set; } = string.Empty; // Ej: Administrador, Coordinador, DocenteAsesor, Estudiante, Evaluador

    public bool Activo { get; set; } = true;

    public DateTime FechaRegistro { get; set; } = DateTime.UtcNow;

    public string? Especialidades { get; set; } // Áreas de conocimiento del profesor
}
