namespace GestionConvocatorias.Identity.Api.DTOs;

public class LoginDto
{
    public string CorreoElectronico { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}
