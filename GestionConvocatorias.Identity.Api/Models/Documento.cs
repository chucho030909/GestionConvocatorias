using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace GestionConvocatorias.Identity.Api.Models;

[Table("Documentos")]
public class Documento
{
    [Key]
    public int Id { get; set; }

    [ForeignKey("Proyecto")]
    public int ProyectoId { get; set; }

    [Required]
    public string NombreArchivo { get; set; } = string.Empty;

    [Required]
    public string RutaUbicacion { get; set; } = string.Empty;

    public string? Tipo { get; set; }

    public int Version { get; set; } = 1;

    [ForeignKey("DocumentoPrevio")]
    public int? DocumentoPrevioId { get; set; }

    public DateTime FechaSubida { get; set; } = DateTime.UtcNow;

    public Proyecto? Proyecto { get; set; }

    public Documento? DocumentoPrevio { get; set; }
}
