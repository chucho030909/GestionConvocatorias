using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace GestionConvocatorias.Identity.Api.Models;

[Table("ProyectoEstudiantes")]
public class ProyectoEstudiante
{
    [Key]
    public int Id { get; set; }

    [ForeignKey("Proyecto")]
    public int ProyectoId { get; set; }

    [ForeignKey("Usuario")]
    public int UsuarioId { get; set; }

    [StringLength(50)]
    public string? RolEnProyecto { get; set; }

    public DateTime FechaAsignacion { get; set; } = DateTime.UtcNow;

    [JsonIgnore]
    public Proyecto? Proyecto { get; set; }

    public Usuario? Usuario { get; set; }
}
