namespace GestionConvocatorias.Identity.Api.DTOs.Proyectos;

public class CrearProyectoDto
{
    public int ConvocatoriaId { get; set; }

    public string Titulo { get; set; } = string.Empty;

    public string Categoria { get; set; } = string.Empty;

    public string Resumen { get; set; } = string.Empty;

    public string ObjetivoGeneral { get; set; } = string.Empty;

    public string ObjetivosEspecificos { get; set; } = string.Empty;

    public string Carrera { get; set; } = string.Empty;

    public string LineaInvestigacion { get; set; } = string.Empty;

    public string? VideoUrl { get; set; }

    public DateTime FechaInicio { get; set; }

    public DateTime? FechaTermino { get; set; }

    public List<int> IntegrantesIds { get; set; } = new();
}
