using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace GestionConvocatorias.Identity.Api.Models;

[Table("ConvocatoriaEstudiantes")]
public class ConvocatoriaEstudiante
{
    [Key]
    public int Id { get; set; }

    [ForeignKey("Convocatoria")]
    public int ConvocatoriaId { get; set; }

    [ForeignKey("Usuario")]
    public int UsuarioId { get; set; }

    public DateTime FechaRegistro { get; set; } = DateTime.UtcNow;

    public Convocatoria? Convocatoria { get; set; }

    public Usuario? Usuario { get; set; }
}
