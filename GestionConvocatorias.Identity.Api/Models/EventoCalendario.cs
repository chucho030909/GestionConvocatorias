using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace GestionConvocatorias.Identity.Api.Models;

[Table("EventosCalendario")]
public class EventoCalendario
{
    [Key]
    public int Id { get; set; }

    [Required]
    [StringLength(200)]
    public string Titulo { get; set; } = string.Empty;

    [StringLength(1000)]
    public string Descripcion { get; set; } = string.Empty;

    [Required]
    public DateTime FechaInicio { get; set; }

    [Required]
    public DateTime FechaFin { get; set; }
}
