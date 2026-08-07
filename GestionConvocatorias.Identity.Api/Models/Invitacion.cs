using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace GestionConvocatorias.Identity.Api.Models;

[Table("Invitaciones")]
public class Invitacion
{
    [Key]
    public int Id { get; set; }

    [Required, MaxLength(64)]
    public string Token { get; set; } = string.Empty;

    [Required, MaxLength(256)]
    public string CorreoElectronico { get; set; } = string.Empty;

    [Required, MaxLength(50)]
    public string Rol { get; set; } = string.Empty;

    public int? ProyectoId { get; set; }

    [MaxLength(200)]
    public string? NombreCompleto { get; set; }

    public DateTime FechaExpiracion { get; set; }

    public bool Aceptada { get; set; }

    public DateTime? FechaAceptacion { get; set; }
}
