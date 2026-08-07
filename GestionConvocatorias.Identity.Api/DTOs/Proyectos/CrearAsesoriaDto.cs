using System.ComponentModel.DataAnnotations;

namespace GestionConvocatorias.Identity.Api.DTOs.Proyectos;

public class CrearAsesoriaDto
{
    [Required]
    public int ProyectoId { get; set; }

    [Required]
    [StringLength(200)]
    public string Titulo { get; set; } = string.Empty;

    [Required]
    [StringLength(2000)]
    public string Descripcion { get; set; } = string.Empty;

    [StringLength(500)]
    public string? Recomendaciones { get; set; }

    [Required]
    [StringLength(50)]
    public string TipoAsesoria { get; set; } = string.Empty;

    [Range(1, 10)]
    public decimal? Calificacion { get; set; }
}
