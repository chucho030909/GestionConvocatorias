namespace GestionConvocatorias.Identity.Api.DTOs;

public class RegistroDocenteDto
{
    public string CorreoElectronico { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string Nombres { get; set; } = string.Empty;
    public string Apellidos { get; set; } = string.Empty;
    public string? Telefono { get; set; }
    public string? GradoAcademico { get; set; }
    public string? Profesion { get; set; }
    public string? Especialidad { get; set; }
    public string? InstitucionProcedencia { get; set; }
    public string? CargoActual { get; set; }
    public int? AnosExperiencia { get; set; }
    public string? LineasInvestigacion { get; set; }
    public string? AreasEspecializacion { get; set; }
    public string? Publicaciones { get; set; }
    public string? Certificaciones { get; set; }
}
