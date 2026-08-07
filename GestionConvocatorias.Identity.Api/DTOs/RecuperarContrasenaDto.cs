namespace GestionConvocatorias.Identity.Api.DTOs;

public class RecuperarContrasenaDto
{
    public string CorreoElectronico { get; set; } = string.Empty;
}

public class RestablecerContrasenaDto
{
    public string Token { get; set; } = string.Empty;
    public string NuevaContrasena { get; set; } = string.Empty;
}
