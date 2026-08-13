namespace GestionConvocatorias.Identity.Api.Services;

public interface IConvocatoriaArchivoService
{
    /// <summary>
    /// Guarda un archivo en la ruta configurada y devuelve la ruta relativa.
    /// </summary>
    Task<string> GuardarArchivoAsync(IFormFile archivo, int convocatoriaId, string tipo);

    /// <summary>
    /// Elimina un archivo por su ruta relativa.
    /// </summary>
    Task EliminarArchivoAsync(string? rutaRelativa);

    /// <summary>
    /// Obtiene un FileStream para lectura validando que esté dentro de la raíz autorizada.
    /// </summary>
    Task<FileStream> ObtenerStreamAsync(string? rutaRelativa);

    /// <summary>
    /// Verifica que la ruta relativa resuelva dentro de la raíz autorizada.
    /// </summary>
    string? ValidarRutaSegura(string? rutaRelativa);

    /// <summary>
    /// Obtiene la raíz de almacenamiento configurada.
    /// </summary>
    string ObtenerRaiz();
}
