using GestionConvocatorias.Identity.Api.Models;
using GestionConvocatorias.Identity.Api.Services;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace GestionConvocatorias.Identity.Api.Data;

public static class DbSeeder
{
    public static async Task SeedAsync(AppDbContext context, RoleManager<IdentityRole<int>> roleManager, UserManager<Usuario> userManager)
    {
        foreach (var rol in Roles.Todos)
        {
            if (!await roleManager.RoleExistsAsync(rol))
            {
                await roleManager.CreateAsync(new IdentityRole<int>(rol));
            }
        }

        if (await userManager.Users.AnyAsync())
            return;

        var administrador = new Usuario
        {
            Nombres = "Administrador",
            Apellidos = "Sistema",
            Email = "admin@uttt.edu.mx",
            UserName = "admin@uttt.edu.mx",
            Rol = Roles.Administrador,
            Activo = true,
            FechaRegistro = DateTime.UtcNow
        };
        await userManager.CreateAsync(administrador, "Password123!");
        await userManager.AddToRoleAsync(administrador, Roles.Administrador);
        context.ChangeTracker.Clear();

        var coordinador = new Usuario
        {
            Nombres = "Coordinador Uno",
            Apellidos = "Reyes",
            Email = "coordinador1@uttt.edu.mx",
            UserName = "coordinador1@uttt.edu.mx",
            Rol = Roles.Coordinador,
            Activo = true,
            FechaRegistro = DateTime.UtcNow
        };
        await userManager.CreateAsync(coordinador, "Password123!");
        await userManager.AddToRoleAsync(coordinador, Roles.Coordinador);
        context.ChangeTracker.Clear();

        var docente1 = new Usuario
        {
            Nombres = "Docente Uno",
            Apellidos = "Torres",
            Email = "docente1@uttt.edu.mx",
            UserName = "docente1@uttt.edu.mx",
            Rol = Roles.DocenteAsesor,
            Activo = true,
            FechaRegistro = DateTime.UtcNow
        };
        await userManager.CreateAsync(docente1, "Password123!");
        await userManager.AddToRoleAsync(docente1, Roles.DocenteAsesor);
        context.ChangeTracker.Clear();

        var docente2 = new Usuario
        {
            Nombres = "Docente Dos",
            Apellidos = "Castro",
            Email = "docente2@uttt.edu.mx",
            UserName = "docente2@uttt.edu.mx",
            Rol = Roles.DocenteAsesor,
            Activo = true,
            FechaRegistro = DateTime.UtcNow
        };
        await userManager.CreateAsync(docente2, "Password123!");
        await userManager.AddToRoleAsync(docente2, Roles.DocenteAsesor);
        context.ChangeTracker.Clear();

        var estudiante1 = new Usuario
        {
            Nombres = "Estudiante Uno",
            Apellidos = "López",
            Email = "estudiante1@uttt.edu.mx",
            UserName = "estudiante1@uttt.edu.mx",
            Rol = Roles.Estudiante,
            Activo = true,
            FechaRegistro = DateTime.UtcNow
        };
        await userManager.CreateAsync(estudiante1, "Password123!");
        await userManager.AddToRoleAsync(estudiante1, Roles.Estudiante);
        context.ChangeTracker.Clear();

        var estudiante2 = new Usuario
        {
            Nombres = "Estudiante Dos",
            Apellidos = "Hernández",
            Email = "estudiante2@uttt.edu.mx",
            UserName = "estudiante2@uttt.edu.mx",
            Rol = Roles.Estudiante,
            Activo = true,
            FechaRegistro = DateTime.UtcNow
        };
        await userManager.CreateAsync(estudiante2, "Password123!");
        await userManager.AddToRoleAsync(estudiante2, Roles.Estudiante);
        context.ChangeTracker.Clear();

        var estudiante3 = new Usuario
        {
            Nombres = "Estudiante Tres",
            Apellidos = "Ramírez",
            Email = "estudiante3@uttt.edu.mx",
            UserName = "estudiante3@uttt.edu.mx",
            Rol = Roles.Estudiante,
            Activo = true,
            FechaRegistro = DateTime.UtcNow
        };
        await userManager.CreateAsync(estudiante3, "Password123!");
        await userManager.AddToRoleAsync(estudiante3, Roles.Estudiante);
        context.ChangeTracker.Clear();

        var evaluador1 = new Usuario
        {
            Nombres = "Evaluador Uno",
            Apellidos = "García",
            Email = "evaluador1@uttt.edu.mx",
            UserName = "evaluador1@uttt.edu.mx",
            Rol = Roles.Evaluador,
            Activo = true,
            FechaRegistro = DateTime.UtcNow,
            Especialidades = "Redes, Seguridad"
        };
        await userManager.CreateAsync(evaluador1, "Password123!");
        await userManager.AddToRoleAsync(evaluador1, Roles.Evaluador);
        context.ChangeTracker.Clear();

        var evaluador2 = new Usuario
        {
            Nombres = "Evaluador Dos",
            Apellidos = "Martínez",
            Email = "evaluador2@uttt.edu.mx",
            UserName = "evaluador2@uttt.edu.mx",
            Rol = Roles.Evaluador,
            Activo = true,
            FechaRegistro = DateTime.UtcNow,
            Especialidades = "Software, IA, Web"
        };
        await userManager.CreateAsync(evaluador2, "Password123!");
        await userManager.AddToRoleAsync(evaluador2, Roles.Evaluador);
        context.ChangeTracker.Clear();

        var convocatoriaActiva = new Convocatoria
        {
            Titulo = "Convocatoria de Innovación 2026",
            Descripcion = "Convocatoria activa para proyectos de innovación tecnológica.",
            FechaApertura = DateTime.UtcNow.AddDays(-10),
            FechaCierre = DateTime.UtcNow.AddDays(20),
            Estado = "Activa"
        };

        var convocatoriaFinalizada = new Convocatoria
        {
            Titulo = "Convocatoria de Desarrollo Sostenible 2025",
            Descripcion = "Convocatoria finalizada para proyectos de sostenibilidad.",
            FechaApertura = DateTime.UtcNow.AddDays(-200),
            FechaCierre = DateTime.UtcNow.AddDays(-100),
            Estado = "Finalizada"
        };

        context.Convocatorias.AddRange(convocatoriaActiva, convocatoriaFinalizada);
        await context.SaveChangesAsync();
        context.ChangeTracker.Clear();

        var proyecto1 = new Proyecto
        {
            ConvocatoriaId = convocatoriaActiva.Id,
            DocenteAsesorId = docente1.Id,
            EvaluadorId = evaluador1.Id,
            Titulo = "App de movilidad urbana",
            Categoria = "Tecnología",
            Resumen = "Sistema de detección de fraudes bancarios utilizando algoritmos de Inteligencia Artificial (IA) y redes neuronales.",
            ObjetivoGeneral = "Desarrollar un sistema de detección de fraudes bancarios.",
            ObjetivosEspecificos = "1. Implementar algoritmos de IA\n2. Entrenar redes neuronales",
            Carrera = "Ingeniería en Sistemas",
            LineaInvestigacion = "Inteligencia Artificial",
            Estado = EstadoProyecto.EnPropuesta,
            FechaInicio = DateTime.UtcNow.AddDays(-5),
            FechaRegistro = DateTime.UtcNow.AddDays(-5)
        };

        var proyecto2 = new Proyecto
        {
            ConvocatoriaId = convocatoriaActiva.Id,
            DocenteAsesorId = docente2.Id,
            EvaluadorId = evaluador2.Id,
            Titulo = "Plataforma de energía solar comunitaria",
            Categoria = "Sostenibilidad",
            Resumen = "Sistema de gestión de paneles solares para comunidades.",
            ObjetivoGeneral = "Crear una plataforma de gestión de energía solar.",
            ObjetivosEspecificos = "1. Diseñar sistema de monitoreo\n2. Implementar panel de control",
            Carrera = "Ingeniería Ambiental",
            LineaInvestigacion = "Energías Renovables",
            Estado = EstadoProyecto.EnPropuesta,
            FechaInicio = DateTime.UtcNow.AddDays(-12),
            FechaRegistro = DateTime.UtcNow.AddDays(-12)
        };

        var proyecto3 = new Proyecto
        {
            ConvocatoriaId = convocatoriaFinalizada.Id,
            Titulo = "Huerta urbana inteligente",
            Categoria = "Sostenibilidad",
            Resumen = "Proyecto de agricultura urbana automatizada.",
            ObjetivoGeneral = "Automatizar una huerta urbana.",
            ObjetivosEspecificos = "1. Instalar sensores\n2. Crear sistema de riego automático",
            Carrera = "Ingeniería Agroindustrial",
            LineaInvestigacion = "Agricultura Inteligente",
            Estado = EstadoProyecto.Finalizado,
            FechaInicio = DateTime.UtcNow.AddDays(-20),
            FechaRegistro = DateTime.UtcNow.AddDays(-20)
        };

        context.Proyectos.AddRange(proyecto1, proyecto2, proyecto3);
        await context.SaveChangesAsync();
        context.ChangeTracker.Clear();

        context.ProyectoEstudiantes.AddRange(
            new ProyectoEstudiante { ProyectoId = proyecto1.Id, UsuarioId = estudiante1.Id, FechaAsignacion = DateTime.UtcNow.AddDays(-5) },
            new ProyectoEstudiante { ProyectoId = proyecto2.Id, UsuarioId = estudiante2.Id, FechaAsignacion = DateTime.UtcNow.AddDays(-12) },
            new ProyectoEstudiante { ProyectoId = proyecto3.Id, UsuarioId = estudiante3.Id, FechaAsignacion = DateTime.UtcNow.AddDays(-20) }
        );

        await context.SaveChangesAsync();
    }
}
