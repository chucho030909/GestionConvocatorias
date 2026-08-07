using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.AspNetCore.Identity;

namespace GestionConvocatorias.Identity.Api.Models;

public class Usuario : IdentityUser<int>
{
    [Required]
    [StringLength(100)]
    public string Nombres { get; set; } = string.Empty;

    [Required]
    [StringLength(100)]
    public string Apellidos { get; set; } = string.Empty;

    [StringLength(100)]
    public string? ApellidoPaterno { get; set; }

    [StringLength(100)]
    public string? ApellidoMaterno { get; set; }

    public DateTime? FechaNacimiento { get; set; }

    [StringLength(150)]
    public string? CorreoPersonal { get; set; }

    [StringLength(30)]
    public string? TelefonoCelular { get; set; }

    [Required]
    [StringLength(30)]
    public string Rol { get; set; } = string.Empty;

    public bool Activo { get; set; } = true;

    public DateTime FechaRegistro { get; set; } = DateTime.UtcNow;

    public string? Especialidades { get; set; }

    // Campos académicos (Estudiantes)
    [StringLength(100)]
    public string? Matricula { get; set; }

    [StringLength(150)]
    public string? Universidad { get; set; }

    [StringLength(150)]
    public string? ProgramaEducativo { get; set; }

    [StringLength(30)]
    public string? Cuatrimestre { get; set; }

    [StringLength(20)]
    public string? Grupo { get; set; }

    [Column(TypeName = "decimal(5,2)")]
    public decimal? PromedioGeneral { get; set; }

    [StringLength(50)]
    public string? Modalidad { get; set; }

    // Archivos de validación (Estudiantes)
    [StringLength(500)]
    public string? RutaIdentificacion { get; set; }

    [StringLength(500)]
    public string? RutaConstancia { get; set; }

    [StringLength(500)]
    public string? RutaCartaCompromiso { get; set; }

    // Campos profesionales (Docentes)
    [StringLength(100)]
    public string? GradoAcademico { get; set; }

    [StringLength(150)]
    public string? Profesion { get; set; }

    [StringLength(200)]
    public string? InstitucionProcedencia { get; set; }

    [StringLength(150)]
    public string? CargoActual { get; set; }

    public int? AnosExperiencia { get; set; }

    [StringLength(2000)]
    public string? LineasInvestigacion { get; set; }

    [StringLength(2000)]
    public string? AreasEspecializacion { get; set; }

    [StringLength(5000)]
    public string? Publicaciones { get; set; }

    [StringLength(2000)]
    public string? Certificaciones { get; set; }

    // Archivos profesionales (Docentes)
    [StringLength(500)]
    public string? RutaCv { get; set; }

    [StringLength(500)]
    public string? RutaCartaConfidencialidad { get; set; }

    // Password recovery
    public string? ResetToken { get; set; }
    public DateTime? ResetTokenExpiry { get; set; }
}
