using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace GestionConvocatorias.Identity.Api.Models;

[Table("InvitacionesEvaluador")]
public class InvitacionEvaluador
{
    [Key]
    public int Id { get; set; }

    [Required, StringLength(200)]
    public string Correo { get; set; } = string.Empty;

    [Required, StringLength(100)]
    public string Token { get; set; } = string.Empty;

    [Required, StringLength(50)]
    public string Rol { get; set; } = Roles.Evaluador;

    public int? ProyectoId { get; set; }

    [StringLength(200)]
    public string? NombreCompleto { get; set; }

    public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;

    public DateTime FechaExpiracion { get; set; }

    [Required]
    public EstadoInvitacion Estado { get; set; } = EstadoInvitacion.Pendiente;

    public DateTime? FechaAceptacion { get; set; }
}
