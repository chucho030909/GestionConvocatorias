using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace GestionConvocatorias.Identity.Api.Models;

[Table("Comentarios")]
public class Comentario
{
    [Key]
    public int Id { get; set; }

    [ForeignKey("Proyecto")]
    public int ProyectoId { get; set; }

    [ForeignKey("Usuario")]
    public int UsuarioId { get; set; }

    [Required]
    public string Texto { get; set; } = string.Empty;

    public DateTime Fecha { get; set; } = DateTime.UtcNow;

    public Proyecto? Proyecto { get; set; }

    public Usuario? Usuario { get; set; }
}

[Table("Avances")]
public class Avance
{
    [Key]
    public int Id { get; set; }

    [ForeignKey("Proyecto")]
    public int ProyectoId { get; set; }

    [ForeignKey("Usuario")]
    public int UsuarioId { get; set; }

    [Required]
    public string Descripcion { get; set; } = string.Empty;

    public int Porcentaje { get; set; }

    public DateTime Fecha { get; set; } = DateTime.UtcNow;

    public Proyecto? Proyecto { get; set; }

    public Usuario? Usuario { get; set; }
}
