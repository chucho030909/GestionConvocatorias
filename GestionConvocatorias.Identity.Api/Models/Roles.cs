namespace GestionConvocatorias.Identity.Api.Models;

public static class Roles
{
    public const string Administrador = "Administrador";
    public const string Coordinador = "Coordinador";
    public const string DocenteAsesor = "DocenteAsesor";
    public const string Estudiante = "Estudiante";
    public const string Evaluador = "Evaluador";

    public static readonly string[] Todos =
    {
        Administrador, Coordinador, DocenteAsesor, Estudiante, Evaluador
    };
}
