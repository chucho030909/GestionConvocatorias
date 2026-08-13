namespace GestionConvocatorias.Identity.Api.Services;

public interface IEmailService
{
    Task EnviarCorreoAsync(string destinatario, string asunto, string cuerpo);
}
