namespace GestionConvocatorias.Identity.Api.Services;

public interface IArchivoService
{
    Task<string> GuardarArchivoAsync(IFormFile archivo, string carpeta);
    Task<byte[]> ObtenerArchivoAsync(string rutaRelativa);
    void EliminarArchivo(string rutaRelativa);
}
