namespace GestionConvocatorias.Identity.Api.DTOs;

public class ConvocatoriaResponseDto
{
    public int Id { get; set; }
    public string Clave { get; set; } = string.Empty;
    public string Titulo { get; set; } = string.Empty;
    public string Descripcion { get; set; } = string.Empty;
    public string TipoConvocatoria { get; set; } = string.Empty;
    public string Objetivo { get; set; } = string.Empty;
    public DateTime FechaPublicacion { get; set; }
    public DateTime FechaApertura { get; set; }
    public DateTime FechaLimiteRegistro { get; set; }
    public DateTime FechaEvaluacion { get; set; }
    public DateTime FechaCierre { get; set; }
    public DateTime FechaPublicacionResultados { get; set; }
    public string Categorias { get; set; } = "[]";
    public int NumeroMaximoProyectos { get; set; }
    public int NumeroMaximoIntegrantes { get; set; }
    public int NumeroEvaluadoresPorProyecto { get; set; }
    public int EscalaEvaluacion { get; set; }
    public string RubricaAsignada { get; set; } = string.Empty;
    public string? LinkRubrica { get; set; }
    public string Estado { get; set; } = string.Empty;
    public string? RutaBases { get; set; }
    public string? RutaConvocatoriaPDF { get; set; }
    public string? RutaFormatos { get; set; }
}
