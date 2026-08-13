using System.Net;
using System.Net.Mail;

namespace GestionConvocatorias.Identity.Api.Services;

public class EmailService : IEmailService
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<EmailService> _logger;

    public EmailService(IConfiguration configuration, ILogger<EmailService> logger)
    {
        _configuration = configuration;
        _logger = logger;
    }

    public async Task EnviarCorreoAsync(string destinatario, string asunto, string cuerpo)
    {
        try
        {
            var host = _configuration["Smtp:Host"] ?? "smtp.gmail.com";
            var puerto = int.Parse(_configuration["Smtp:Port"] ?? "587");
            var usuario = _configuration["Smtp:Username"] ?? "";
            var contraseña = _configuration["Smtp:Password"] ?? "";
            var remitente = _configuration["Smtp:From"] ?? usuario;

            using var client = new SmtpClient(host, puerto)
            {
                Credentials = new NetworkCredential(usuario, contraseña),
                EnableSsl = true
            };

            var mensaje = new MailMessage(remitente, destinatario, asunto, cuerpo)
            {
                IsBodyHtml = true
            };

            await client.SendMailAsync(mensaje);

            _logger.LogInformation("Correo enviado exitosamente a {Destinatario}", destinatario);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al enviar correo a {Destinatario}", destinatario);
            throw;
        }
    }
}
