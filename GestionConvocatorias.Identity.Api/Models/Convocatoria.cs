using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace GestionConvocatorias.Identity.Api.Models;

[Table("Convocatorias")]
public class Convocatoria
{
    [Key]
    public int Id { get; set; }

    [Required]
    [StringLength(150)]
    public string Titulo { get; set; } = string.Empty;

    public string Descripcion { get; set; } = string.Empty;

    public DateTime FechaApertura { get; set; }

    public DateTime FechaCierre { get; set; }

    [StringLength(20)]
    public string Estado { get; set; } = "Activa";
}
