using GestionConvocatorias.Identity.Api.Models;
using System.Globalization;
using System.Text.RegularExpressions;

namespace GestionConvocatorias.Identity.Api.Services;

public static class EvaluacionService
{
    public static List<Usuario> SugerirEvaluadores(string resumenProyecto, List<Usuario> todosLosEvaluadores)
    {
        var palabrasClave = ExtraerPalabrasClave(resumenProyecto);

        var puntuados = todosLosEvaluadores
            .Select(evaluador => new
            {
                Evaluador = evaluador,
                Puntuacion = CalcularCoincidencias(palabrasClave, evaluador.Especialidades)
            })
            .OrderByDescending(x => x.Puntuacion)
            .ThenBy(x => x.Evaluador.Nombres)
            .Select(x => x.Evaluador)
            .ToList();

        return puntuados;
    }

    private static HashSet<string> ExtraerPalabrasClave(string texto)
    {
        if (string.IsNullOrWhiteSpace(texto))
            return new HashSet<string>();

        return Regex.Replace(texto.ToLowerInvariant(), @"[^\p{L}\p{N}\s]", " ")
            .Split([' ', '\t', '\n', '\r'], StringSplitOptions.RemoveEmptyEntries)
            .Where(p => p.Length >= 2)
            .ToHashSet();
    }

    private static int CalcularCoincidencias(HashSet<string> palabrasClave, string? especialidades)
    {
        if (palabrasClave.Count == 0 || string.IsNullOrWhiteSpace(especialidades))
            return 0;

        var terminos = Regex.Replace(especialidades.ToLowerInvariant(), @"[^\p{L}\p{N}\s]", " ")
            .Split([' ', '\t', '\n', '\r'], StringSplitOptions.RemoveEmptyEntries)
            .Where(t => t.Length >= 2)
            .ToHashSet();

        return palabrasClave.Count(p => terminos.Contains(p));
    }
}
