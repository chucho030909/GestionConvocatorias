namespace GestionConvocatorias.Identity.Api.DTOs;

public class RegistroEstudianteDto
{
    // Credenciales
    public string CorreoElectronico { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;

    // Personales
    public string? Matricula { get; set; }
    public string Nombres { get; set; } = string.Empty;
    public string? ApellidoPaterno { get; set; }
    public string? ApellidoMaterno { get; set; }
    public DateTime? FechaNacimiento { get; set; }
    public string? CorreoPersonal { get; set; }
    public string? TelefonoCelular { get; set; }

    // Académicos
    public string? Universidad { get; set; }
    public string? ProgramaEducativo { get; set; }
    public string? Cuatrimestre { get; set; }
    public string? Grupo { get; set; }
    public decimal? PromedioGeneral { get; set; }
    public string? Modalidad { get; set; }

    // Validación
    public bool AceptaPrivacidad { get; set; }
}
