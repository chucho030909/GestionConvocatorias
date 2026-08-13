namespace GestionConvocatorias.Identity.Api.Services;

public class ConvocatoriaArchivoService : IConvocatoriaArchivoService
{
    private readonly string _raizArchivos;
    private readonly ILogger<ConvocatoriaArchivoService> _logger;

    public ConvocatoriaArchivoService(IConfiguration configuration, ILogger<ConvocatoriaArchivoService> logger)
    {
        var configurada = configuration["Storage:RootPath"];
        _raizArchivos = !string.IsNullOrWhiteSpace(configurada)
            ? configurada
            : Path.Combine(AppContext.BaseDirectory, "ArchivosGuardados");

        _logger = logger;

        if (!Directory.Exists(_raizArchivos))
        {
            try
            {
                Directory.CreateDirectory(_raizArchivos);
            }
            catch (Exception ex)
            {
                throw new InvalidOperationException($"No se pudo crear la carpeta de almacenamiento en {_raizArchivos}", ex);
            }
        }

        // Verificar escritura
        var testFile = Path.Combine(_raizArchivos, $".write_test_{Guid.NewGuid():N}.tmp");
        try
        {
            System.IO.File.WriteAllText(testFile, "test");
            System.IO.File.Delete(testFile);
        }
        catch (Exception ex)
        {
            throw new InvalidOperationException($"La ruta de almacenamiento {_raizArchivos} no es escribible.", ex);
        }
    }

    public string ObtenerRaiz() => _raizArchivos;

    public string? ValidarRutaSegura(string? rutaRelativa)
    {
        if (string.IsNullOrWhiteSpace(rutaRelativa))
            return null;

        var rutaLimpia = rutaRelativa.Replace('/', Path.DirectorySeparatorChar).TrimStart(Path.DirectorySeparatorChar);
        var rutaCompleta = Path.GetFullPath(Path.Combine(_raizArchivos, rutaLimpia));
        var rutaRaiz = Path.GetFullPath(_raizArchivos);

        if (!rutaCompleta.StartsWith(rutaRaiz, StringComparison.OrdinalIgnoreCase))
        {
            _logger.LogWarning("Intento de acceso fuera de la raiz autorizada. Relativa: {RutaRelativa}, Resuelta: {RutaCompleta}", rutaRelativa, rutaCompleta);
            throw new UnauthorizedAccessException("Acceso denegado: ruta no válida.");
        }

        return rutaCompleta;
    }

    public async Task<string> GuardarArchivoAsync(IFormFile archivo, int convocatoriaId, string tipo)
    {
        if (archivo == null || archivo.Length == 0)
            throw new ArgumentException("El archivo es nulo o vacío.", nameof(archivo));

        var extension = Path.GetExtension(archivo.FileName).ToLowerInvariant();
        var nombreArchivo = $"{convocatoriaId}_{tipo}_{Guid.NewGuid():N}{extension}";
        var carpeta = Path.Combine(_raizArchivos, "ArchivosConvocatorias");

        if (!Directory.Exists(carpeta))
            Directory.CreateDirectory(carpeta);

        var rutaCompleta = Path.Combine(carpeta, nombreArchivo);

        using var stream = new FileStream(rutaCompleta, FileMode.Create);
        await archivo.CopyToAsync(stream);

        var rutaRelativa = Path.Combine("ArchivosConvocatorias", nombreArchivo);
        _logger.LogInformation("Archivo guardado. ConvocatoriaId={ConvocatoriaId}, Tipo={Tipo}, Ruta={Ruta}", convocatoriaId, tipo, rutaRelativa);
        return rutaRelativa;
    }

    public async Task EliminarArchivoAsync(string? rutaRelativa)
    {
        var rutaCompleta = ValidarRutaSegura(rutaRelativa);
        if (rutaCompleta == null)
            return;

        if (System.IO.File.Exists(rutaCompleta))
        {
            try
            {
                System.IO.File.Delete(rutaCompleta);
                _logger.LogInformation("Archivo eliminado. Ruta={Ruta}", rutaRelativa);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "No se pudo eliminar archivo. Ruta={Ruta}", rutaRelativa);
            }
        }
    }

    public Task<FileStream> ObtenerStreamAsync(string? rutaRelativa)
    {
        var rutaCompleta = ValidarRutaSegura(rutaRelativa);
        if (rutaCompleta == null || !System.IO.File.Exists(rutaCompleta))
            throw new FileNotFoundException("El archivo no existe.");

        var stream = new FileStream(rutaCompleta, FileMode.Open, FileAccess.Read, FileShare.Read);
        return Task.FromResult(stream);
    }
}
