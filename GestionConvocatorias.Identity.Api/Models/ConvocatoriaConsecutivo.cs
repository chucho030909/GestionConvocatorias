using System.ComponentModel.DataAnnotations;

namespace GestionConvocatorias.Identity.Api.Models;

public class ConvocatoriaConsecutivo
{
    [Key]
    public int Anio { get; set; }

    public int UltimoNumero { get; set; }
}
