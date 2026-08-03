using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace GestionConvocatorias.Identity.Api.Models;

[Table("Notificaciones")]
public class Notificacion
{
    [Key]
    public int Id { get; set; }

    [ForeignKey("Usuario")]
    public int UsuarioId { get; set; }

    [Required]
    [StringLength(500)]
    public string Mensaje { get; set; } = string.Empty;

    [Required]
    public TipoNotificacion Tipo { get; set; }

    public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;

    public bool Leida { get; set; } = false;

    public Usuario? Usuario { get; set; }
}
