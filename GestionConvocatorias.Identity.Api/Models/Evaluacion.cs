using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace GestionConvocatorias.Identity.Api.Models;

[Table("Evaluaciones")]
public class Evaluacion
{
    [Key]
    public int Id { get; set; }

    [ForeignKey("Proyecto")]
    public int ProyectoId { get; set; }

    [ForeignKey("Usuario")]
    public int EvaluadorId { get; set; }

    [Range(1, 5)]
    public int CalificacionInnovacion { get; set; }

    [Range(1, 5)]
    public int CalificacionViabilidad { get; set; }

    [Range(1, 5)]
    public int CalificacionImpactoSocial { get; set; }

    [Range(1, 5)]
    public int CalificacionSustentabilidad { get; set; }

    [Range(1, 5)]
    public int CalificacionModeloNegocio { get; set; }

    [Column(TypeName = "decimal(5,2)")]
    public decimal PuntajeTotal { get; set; }

    [StringLength(1000)]
    public string Comentarios { get; set; } = string.Empty;

    [StringLength(256)]
    public string? FirmaElectronica { get; set; }

    public DateTime FechaEvaluacion { get; set; } = DateTime.UtcNow;

    public Proyecto? Proyecto { get; set; }

    public Usuario? Evaluador { get; set; }
}
