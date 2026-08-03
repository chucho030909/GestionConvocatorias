namespace GestionConvocatorias.Identity.Api.DTOs.Proyectos;

public class CrearComentarioDto
{
    public int ProyectoId { get; set; }
    public string Texto { get; set; } = string.Empty;
}

public class CrearAvanceDto
{
    public int ProyectoId { get; set; }
    public string Descripcion { get; set; } = string.Empty;
    public int Porcentaje { get; set; }
}

public class AsignacionDto
{
    public int ProyectoId { get; set; }
    public int? DocenteAsesorId { get; set; }
    public int? EvaluadorId { get; set; }
}

public class CambiarEstadoDto
{
    public string Estado { get; set; } = string.Empty;
}
