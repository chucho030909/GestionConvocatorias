namespace GestionConvocatorias.Identity.Api.DTOs.Proyectos;

public class CrearProyectoDto
{
    public int ConvocatoriaId { get; set; }

    public string Titulo { get; set; } = string.Empty;

    public string NombreEquipo { get; set; } = string.Empty;

    public string Categoria { get; set; } = string.Empty;

    public string? Resumen { get; set; }

    public string? ObjetivoGeneral { get; set; }

    public string? ObjetivosEspecificos { get; set; }

    public string? Carrera { get; set; }

    public string? LineaInvestigacion { get; set; }

    public List<string>? IntegrantesEmails { get; set; }
}
