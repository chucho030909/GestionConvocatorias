using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace GestionConvocatorias.Identity.Api.Models;

[Table("Asesorias")]
public class Asesoria
{
    [Key]
    public int Id { get; set; }

    [ForeignKey("Proyecto")]
    public int ProyectoId { get; set; }

    [ForeignKey("Usuario")]
    public int DocenteAsesorId { get; set; }

    [StringLength(200)]
    public string Titulo { get; set; } = string.Empty;

    [StringLength(2000)]
    public string Descripcion { get; set; } = string.Empty;

    [StringLength(500)]
    public string? Recomendaciones { get; set; }

    [StringLength(50)]
    public string TipoAsesoria { get; set; } = string.Empty; // Tecnica, Metodologica, General

    [Column(TypeName = "decimal(3,1)")]
    public decimal? Calificacion { get; set; } // Opcional, 1-10

    public DateTime FechaAsesoria { get; set; } = DateTime.UtcNow;

    public Proyecto? Proyecto { get; set; }

    public Usuario? DocenteAsesor { get; set; }
}
