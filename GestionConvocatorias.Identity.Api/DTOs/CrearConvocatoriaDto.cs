using System.ComponentModel.DataAnnotations;

namespace GestionConvocatorias.Identity.Api.DTOs;

public class CrearConvocatoriaDto
{
    [Required]
    [StringLength(150)]
    public string Titulo { get; set; } = string.Empty;

    public string Descripcion { get; set; } = string.Empty;

    [Required]
    [StringLength(100)]
    public string TipoConvocatoria { get; set; } = string.Empty;

    public string Objetivo { get; set; } = string.Empty;

    public DateTime FechaPublicacion { get; set; }

    public DateTime FechaApertura { get; set; }

    public DateTime FechaLimiteRegistro { get; set; }

    public DateTime FechaEvaluacion { get; set; }

    public DateTime FechaCierre { get; set; }

    public DateTime FechaPublicacionResultados { get; set; }

    [StringLength(2000)]
    public string Categorias { get; set; } = "[]";

    public int NumeroMaximoProyectos { get; set; } = 50;

    public int NumeroMaximoIntegrantes { get; set; } = 5;

    public int NumeroEvaluadoresPorProyecto { get; set; } = 2;

    public int EscalaEvaluacion { get; set; } = 5;

    [StringLength(500)]
    public string RubricaAsignada { get; set; } = string.Empty;

    [StringLength(1000)]
    public string? LinkRubrica { get; set; }

    [StringLength(20)]
    public string Estado { get; set; } = "Activa";
}
