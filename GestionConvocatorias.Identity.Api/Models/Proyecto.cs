using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace GestionConvocatorias.Identity.Api.Models;

[Table("Proyectos")]
public class Proyecto
{
    [Key]
    public int Id { get; set; }

    [ForeignKey("Convocatoria")]
    public int ConvocatoriaId { get; set; }

    [ForeignKey("DocenteAsesor")]
    public int? DocenteAsesorId { get; set; }

    [ForeignKey("Evaluador")]
    public int? EvaluadorId { get; set; }

    [Required]
    [StringLength(50)]
    public string Folio { get; set; } = string.Empty;

    [Required]
    [StringLength(200)]
    public string Titulo { get; set; } = string.Empty;

    [Required]
    [StringLength(150)]
    public string NombreEquipo { get; set; } = string.Empty;

    [Required]
    [StringLength(100)]
    public string Modalidad { get; set; } = string.Empty;

    [Required]
    [StringLength(100)]
    public string AreaConocimiento { get; set; } = string.Empty;

    public string Problema { get; set; } = string.Empty;

    public string Justificacion { get; set; } = string.Empty;

    [Required]
    [StringLength(100)]
    public string Categoria { get; set; } = string.Empty;

    [Required]
    public string Resumen { get; set; } = string.Empty;

    [Required]
    [StringLength(500)]
    public string ObjetivoGeneral { get; set; } = string.Empty;

    [Required]
    public string ObjetivosEspecificos { get; set; } = string.Empty;

    [Required]
    [StringLength(150)]
    public string Carrera { get; set; } = string.Empty;

    [Required]
    [StringLength(150)]
    public string LineaInvestigacion { get; set; } = string.Empty;

    public string? VideoUrl { get; set; }

    [StringLength(500)]
    public string? RutaPropuestaPDF { get; set; }

    [StringLength(500)]
    public string? RutaCodigoFuente { get; set; }

    [StringLength(500)]
    public string? GitHubUrl { get; set; }

    [Required]
    public EstadoProyecto Estado { get; set; } = EstadoProyecto.EnPropuesta;

    public int Progreso { get; set; } = 0;

    [Required]
    public DateTime FechaInicio { get; set; }

    public DateTime? FechaTermino { get; set; }

    public DateTime FechaRegistro { get; set; } = DateTime.UtcNow;

    public ICollection<ProyectoEstudiante>? Integrantes { get; set; }

    public ICollection<Avance>? Avances { get; set; }

    public ICollection<Evaluacion>? Evaluaciones { get; set; }

    public Convocatoria? Convocatoria { get; set; }

    public Usuario? DocenteAsesor { get; set; }

    public Usuario? Evaluador { get; set; }
}
