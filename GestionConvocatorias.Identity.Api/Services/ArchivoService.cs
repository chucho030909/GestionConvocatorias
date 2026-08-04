namespace GestionConvocatorias.Identity.Api.Services;

public class ArchivoService : IArchivoService
{
    private readonly string _raizArchivos;

    public ArchivoService(IWebHostEnvironment env)
    {
        _raizArchivos = Path.Combine(env.ContentRootPath, "ArchivosGuardados");
        if (!Directory.Exists(_raizArchivos))
            Directory.CreateDirectory(_raizArchivos);
    }

    public async Task<string> GuardarArchivoAsync(IFormFile archivo, string carpeta)
    {
        var rutaCarpeta = Path.Combine(_raizArchivos, carpeta);
        if (!Directory.Exists(rutaCarpeta))
            Directory.CreateDirectory(rutaCarpeta);

        var nombreArchivo = $"{Guid.NewGuid()}_{Path.GetFileName(archivo.FileName)}";
        var rutaCompleta = Path.Combine(rutaCarpeta, nombreArchivo);

        using var stream = new FileStream(rutaCompleta, FileMode.Create);
        await archivo.CopyToAsync(stream);

        return Path.Combine(carpeta, nombreArchivo);
    }

    public async Task<byte[]> ObtenerArchivoAsync(string rutaRelativa)
    {
        var rutaCompleta = Path.Combine(_raizArchivos, rutaRelativa);
        if (!System.IO.File.Exists(rutaCompleta))
            throw new FileNotFoundException("El archivo no existe.");

        return await System.IO.File.ReadAllBytesAsync(rutaCompleta);
    }

    public void EliminarArchivo(string rutaRelativa)
    {
        var rutaCompleta = Path.Combine(_raizArchivos, rutaRelativa);
        if (System.IO.File.Exists(rutaCompleta))
            System.IO.File.Delete(rutaCompleta);
    }
}
