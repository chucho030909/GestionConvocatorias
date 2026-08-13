using GestionConvocatorias.Identity.Api.Data;
using GestionConvocatorias.Identity.Api.Services;
using Microsoft.EntityFrameworkCore;
using System.Text.RegularExpressions;

namespace GestionConvocatorias.Identity.Api.Commands;

public static class AuditoriaConvocatoriasCommand
{
    public static async Task EjecutarAsync(IServiceProvider services, TextWriter output)
    {
        using var scope = services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var archivoService = scope.ServiceProvider.GetRequiredService<IConvocatoriaArchivoService>();

        var raiz = archivoService.ObtenerRaiz();

        var convocatorias = await context.Convocatorias.AsNoTracking().ToListAsync();
        var rutasRegistradas = new List<(int Id, string? Tipo, string? Ruta)>();

        foreach (var c in convocatorias)
        {
            if (!string.IsNullOrWhiteSpace(c.RutaBases))
                rutasRegistradas.Add((c.Id, "bases", c.RutaBases));
            if (!string.IsNullOrWhiteSpace(c.RutaConvocatoriaPDF))
                rutasRegistradas.Add((c.Id, "convocatoria", c.RutaConvocatoriaPDF));
            if (!string.IsNullOrWhiteSpace(c.RutaFormatos))
                rutasRegistradas.Add((c.Id, "formatos", c.RutaFormatos));
        }

        var archivosEnDisco = new List<string>();
        var carpetaConvocatorias = Path.Combine(raiz, "ArchivosConvocatorias");
        if (Directory.Exists(carpetaConvocatorias))
        {
            archivosEnDisco.AddRange(Directory.EnumerateFiles(carpetaConvocatorias, "*", SearchOption.AllDirectories)
                .Select(f => Path.GetRelativePath(raiz, f).Replace(Path.DirectorySeparatorChar, '/')));
        }

        var rutasRelativas = rutasRegistradas.Select(r => r.Ruta).ToList();
        var rutasSinArchivo = rutasRegistradas
            .Where(r => !string.IsNullOrWhiteSpace(r.Ruta) && !archivosEnDisco.Contains(r.Ruta!.Replace('/', Path.DirectorySeparatorChar)))
            .ToList();

        var archivosSinReferencia = archivosEnDisco
            .Where(a => !rutasRelativas.Contains(a.Replace(Path.DirectorySeparatorChar, '/')))
            .ToList();

        var rutasFueraDeRaiz = rutasRegistradas
            .Where(r =>
            {
                if (string.IsNullOrWhiteSpace(r.Ruta)) return false;
                try
                {
                    archivoService.ValidarRutaSegura(r.Ruta);
                    return false;
                }
                catch (UnauthorizedAccessException)
                {
                    return true;
                }
            })
            .ToList();

        await output.WriteLineAsync("=== AUDITORIA DE CONVOCATORIAS Y ARCHIVOS ===");
        await output.WriteLineAsync($"Raiz de almacenamiento: {raiz}");
        await output.WriteLineAsync($"Total convocatorias: {convocatorias.Count}");
        await output.WriteLineAsync($"Total rutas registradas: {rutasRegistradas.Count}");
        await output.WriteLineAsync($"Total archivos en disco: {archivosEnDisco.Count}");
        await output.WriteLineAsync($"Rutas sin archivo (huérfanas en BD): {rutasSinArchivo.Count}");
        await output.WriteLineAsync($"Archivos sin referencia (huérfanos en disco): {archivosSinReferencia.Count}");
        await output.WriteLineAsync($"Rutas fuera de raiz autorizada: {rutasFueraDeRaiz.Count}");
        await output.WriteLineAsync("");

        if (rutasSinArchivo.Count > 0)
        {
            await output.WriteLineAsync("--- RUTAS REGISTRADAS SIN ARCHIVO EN DISCO ---");
            foreach (var r in rutasSinArchivo)
            {
                await output.WriteLineAsync($"Convocatoria {r.Id} | Tipo: {r.Tipo} | Ruta: {r.Ruta}");
            }
            await output.WriteLineAsync("");
        }

        if (archivosSinReferencia.Count > 0)
        {
            await output.WriteLineAsync("--- ARCHIVOS EN DISCO SIN REFERENCIA EN BD ---");
            foreach (var a in archivosSinReferencia)
            {
                await output.WriteLineAsync($"{a}");
            }
            await output.WriteLineAsync("");
        }

        if (rutasFueraDeRaiz.Count > 0)
        {
            await output.WriteLineAsync("--- RUTAS FUERA DE LA RAIZ AUTORIZADA ---");
            foreach (var r in rutasFueraDeRaiz)
            {
                await output.WriteLineAsync($"Convocatoria {r.Id} | Tipo: {r.Tipo} | Ruta: {r.Ruta}");
            }
            await output.WriteLineAsync("");
        }

        await output.WriteLineAsync("=== RESUMEN POR TIPO ===");
        var tipos = new[] { "bases", "convocatoria", "formatos" };
        foreach (var tipo in tipos)
        {
            var total = rutasRegistradas.Count(r => r.Tipo == tipo);
            var ok = rutasRegistradas.Count(r => r.Tipo == tipo && !string.IsNullOrWhiteSpace(r.Ruta) && archivosEnDisco.Contains(r.Ruta!.Replace('/', Path.DirectorySeparatorChar)));
            var faltan = total - ok;
            await output.WriteLineAsync($"{tipo}: registradas={total}, con archivo={ok}, sin archivo={faltan}");
        }

        await output.WriteLineAsync("");
        await output.WriteLineAsync("Fin de auditoria. No se elimino ni movio ningun archivo.");
    }
}
