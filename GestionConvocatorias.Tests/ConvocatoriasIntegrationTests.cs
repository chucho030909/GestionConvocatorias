using System.Data.Common;
using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using GestionConvocatorias.Identity.Api.Data;
using GestionConvocatorias.Identity.Api.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace GestionConvocatorias.Tests;

public class ConvocatoriasIntegrationTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;
    private readonly HttpClient _client;
    private readonly SqliteConnection _connection;

    public ConvocatoriasIntegrationTests(WebApplicationFactory<Program> factory)
    {
        var tempDir = Path.Combine(Path.GetTempPath(), $"conv_test_{Guid.NewGuid():N}");
        Directory.CreateDirectory(tempDir);

        _connection = new SqliteConnection("DataSource=:memory:");
        _connection.Open();

        _factory = factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureServices(services =>
            {
                var descriptors = services.Where(
                    d => d.ServiceType == typeof(DbContextOptions<AppDbContext>)
                ).ToList();
                foreach (var d in descriptors) services.Remove(d);

                services.AddSingleton<DbConnection>(_connection);
                services.AddDbContext<AppDbContext>((container, options) =>
                {
                    options.UseSqlite(container.GetRequiredService<DbConnection>());
                });

                builder.UseSetting("Storage:RootPath", tempDir);
            });
        });

        _client = _factory.CreateClient();

        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        context.Database.EnsureCreated();

        var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole<int>>>();
        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<Usuario>>();
        SeedIdentityAsync(roleManager, userManager).GetAwaiter().GetResult();
    }

    private static async Task SeedIdentityAsync(RoleManager<IdentityRole<int>> roleManager, UserManager<Usuario> userManager)
    {
        if (!await roleManager.RoleExistsAsync("Administrador"))
            await roleManager.CreateAsync(new IdentityRole<int>("Administrador"));

        if (await userManager.FindByEmailAsync("admin@test.com") == null)
        {
            var admin = new Usuario
            {
                Nombres = "Admin",
                Apellidos = "Test",
                Email = "admin@test.com",
                UserName = "admin@test.com",
                Rol = "Administrador",
                Activo = true,
                FechaRegistro = DateTime.UtcNow
            };
            await userManager.CreateAsync(admin, "Password123!");
            await userManager.AddToRoleAsync(admin, "Administrador");
        }
    }

    private async Task<string> GetAdminTokenAsync()
    {
        var login = new { CorreoElectronico = "admin@test.com", Password = "Password123!" };
        var response = await _client.PostAsJsonAsync("/api/auth/login", login);
        response.EnsureSuccessStatusCode();
        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        return json.GetProperty("datos").GetProperty("token").GetString()!;
    }

    [Fact]
    public async Task Post_Convocatoria_Genera_Clave_Exitosamente()
    {
        var token = await GetAdminTokenAsync();
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var form = CrearFormData(new Dictionary<string, string>
        {
            ["Titulo"] = "Test Convocatoria",
            ["TipoConvocatoria"] = "Innovacion",
            ["Descripcion"] = "Desc",
            ["Objetivo"] = "Obj",
            ["FechaPublicacion"] = DateTime.UtcNow.ToString("O"),
            ["FechaApertura"] = DateTime.UtcNow.AddDays(1).ToString("O"),
            ["FechaLimiteRegistro"] = DateTime.UtcNow.AddDays(5).ToString("O"),
            ["FechaCierre"] = DateTime.UtcNow.AddDays(10).ToString("O"),
            ["FechaEvaluacion"] = DateTime.UtcNow.AddDays(15).ToString("O"),
            ["FechaPublicacionResultados"] = DateTime.UtcNow.AddDays(20).ToString("O"),
            ["Categorias"] = "[]",
            ["Estado"] = "Activa",
            ["NumeroMaximoProyectos"] = "50",
            ["NumeroMaximoIntegrantes"] = "5",
            ["NumeroEvaluadoresPorProyecto"] = "2",
            ["EscalaEvaluacion"] = "5",
            ["RubricaAsignada"] = "Rubrica base",
            ["LinkRubrica"] = "https://example.com"
        });

        var response = await _client.PostAsync("/api/convocatorias", form);
        var body = await response.Content.ReadAsStringAsync();

        Assert.True(response.StatusCode == HttpStatusCode.Created, $"POST returned {response.StatusCode}: {body}");
        using var doc = JsonDocument.Parse(body);
        var clave = doc.RootElement.GetProperty("clave").GetString();
        Assert.NotNull(clave);
        Assert.Matches(@"^CONV-\d{4}-\d{4}$", clave);
    }

    [Fact]
    public async Task Get_Archivo_Sin_Jwt_Devuelve_401()
    {
        _client.DefaultRequestHeaders.Authorization = null;
        var response = await _client.GetAsync("/api/convocatorias/1/archivos/bases");
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Get_Archivo_Inexistente_Devuelve_404()
    {
        var token = await GetAdminTokenAsync();
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        // Create a convocatoria without files
        var form = CrearFormData(new Dictionary<string, string>
        {
            ["Titulo"] = "Sin archivos",
            ["TipoConvocatoria"] = "Innovacion",
            ["FechaPublicacion"] = DateTime.UtcNow.ToString("O"),
            ["FechaApertura"] = DateTime.UtcNow.AddDays(1).ToString("O"),
            ["FechaLimiteRegistro"] = DateTime.UtcNow.AddDays(5).ToString("O"),
            ["FechaCierre"] = DateTime.UtcNow.AddDays(10).ToString("O"),
            ["FechaEvaluacion"] = DateTime.UtcNow.AddDays(15).ToString("O"),
            ["FechaPublicacionResultados"] = DateTime.UtcNow.AddDays(20).ToString("O"),
            ["Categorias"] = "[]",
            ["Estado"] = "Activa",
            ["NumeroMaximoProyectos"] = "50",
            ["NumeroMaximoIntegrantes"] = "5",
            ["NumeroEvaluadoresPorProyecto"] = "2",
            ["EscalaEvaluacion"] = "5",
            ["RubricaAsignada"] = "Rubrica base",
            ["LinkRubrica"] = "https://example.com"
        });
        var post = await _client.PostAsync("/api/convocatorias", form);
        post.EnsureSuccessStatusCode();
        var body = await post.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(body);
        var id = doc.RootElement.GetProperty("id").GetInt32();

        var response = await _client.GetAsync($"/api/convocatorias/{id}/archivos/bases");
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Put_Actualiza_Sin_Cambiar_Clave()
    {
        var token = await GetAdminTokenAsync();
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        // Create
        var form = CrearFormData(new Dictionary<string, string>
        {
            ["Titulo"] = "Original",
            ["TipoConvocatoria"] = "Innovacion",
            ["FechaPublicacion"] = DateTime.UtcNow.ToString("O"),
            ["FechaApertura"] = DateTime.UtcNow.AddDays(1).ToString("O"),
            ["FechaLimiteRegistro"] = DateTime.UtcNow.AddDays(5).ToString("O"),
            ["FechaCierre"] = DateTime.UtcNow.AddDays(10).ToString("O"),
            ["FechaEvaluacion"] = DateTime.UtcNow.AddDays(15).ToString("O"),
            ["FechaPublicacionResultados"] = DateTime.UtcNow.AddDays(20).ToString("O"),
            ["Categorias"] = "[]",
            ["Estado"] = "Activa",
            ["NumeroMaximoProyectos"] = "50",
            ["NumeroMaximoIntegrantes"] = "5",
            ["NumeroEvaluadoresPorProyecto"] = "2",
            ["EscalaEvaluacion"] = "5",
            ["RubricaAsignada"] = "Rubrica base",
            ["LinkRubrica"] = "https://example.com"
        });
        var post = await _client.PostAsync("/api/convocatorias", form);
        post.EnsureSuccessStatusCode();
        var body = await post.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(body);
        var id = doc.RootElement.GetProperty("id").GetInt32();
        var claveOriginal = doc.RootElement.GetProperty("clave").GetString();

        // Update
        var putForm = CrearFormData(new Dictionary<string, string>
        {
            ["Titulo"] = "Actualizado",
            ["TipoConvocatoria"] = "Innovacion",
            ["FechaPublicacion"] = DateTime.UtcNow.ToString("O"),
            ["FechaApertura"] = DateTime.UtcNow.AddDays(1).ToString("O"),
            ["FechaLimiteRegistro"] = DateTime.UtcNow.AddDays(5).ToString("O"),
            ["FechaCierre"] = DateTime.UtcNow.AddDays(10).ToString("O"),
            ["FechaEvaluacion"] = DateTime.UtcNow.AddDays(15).ToString("O"),
            ["FechaPublicacionResultados"] = DateTime.UtcNow.AddDays(20).ToString("O"),
            ["Categorias"] = "[]",
            ["Estado"] = "Activa",
            ["NumeroMaximoProyectos"] = "50",
            ["NumeroMaximoIntegrantes"] = "5",
            ["NumeroEvaluadoresPorProyecto"] = "2",
            ["EscalaEvaluacion"] = "5",
            ["RubricaAsignada"] = "Rubrica base",
            ["LinkRubrica"] = "https://example.com"
        });
        var put = await _client.PutAsync($"/api/convocatorias/{id}", putForm);
        put.EnsureSuccessStatusCode();
        var putBody = await put.Content.ReadAsStringAsync();
        using var putDoc = JsonDocument.Parse(putBody);
        var clavePut = putDoc.RootElement.GetProperty("clave").GetString();

        Assert.Equal(claveOriginal, clavePut);
        Assert.Equal("Actualizado", putDoc.RootElement.GetProperty("titulo").GetString());
    }

    private static MultipartFormDataContent CrearFormData(Dictionary<string, string> campos)
    {
        var content = new MultipartFormDataContent();
        foreach (var kv in campos)
            content.Add(new StringContent(kv.Value), kv.Key);
        return content;
    }
}
