namespace GestionConvocatorias.Identity.Api.DTOs.Proyectos;

public class CrearEvaluacionDto
{
    public int ProyectoId { get; set; }

    public int CalificacionInnovacion { get; set; }

    public int CalificacionViabilidad { get; set; }

    public int CalificacionImpactoSocial { get; set; }

    public int CalificacionSustentabilidad { get; set; }

    public int CalificacionModeloNegocio { get; set; }

    public string Comentarios { get; set; } = string.Empty;
}
