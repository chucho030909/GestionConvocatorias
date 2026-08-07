using System.ComponentModel.DataAnnotations;

namespace GestionConvocatorias.Identity.Api.DTOs;

public class ActualizarEspecialidadesDto
{
    [StringLength(500)]
    public string? Especialidades { get; set; }
}
