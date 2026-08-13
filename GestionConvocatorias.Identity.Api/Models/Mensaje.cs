using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace GestionConvocatorias.Identity.Api.Models;

[Table("Mensajes")]
public class Mensaje
{
    [Key]
    public int Id { get; set; }

    [ForeignKey("Emisor")]
    public int EmisorId { get; set; }

    [ForeignKey("Receptor")]
    public int ReceptorId { get; set; }

    [Required]
    public string Contenido { get; set; } = string.Empty;

    public DateTime FechaEnvio { get; set; } = DateTime.UtcNow;

    public bool Leido { get; set; } = false;

    public Usuario? Emisor { get; set; }

    public Usuario? Receptor { get; set; }
}
