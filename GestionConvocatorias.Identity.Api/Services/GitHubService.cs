using System.Net.Http.Headers;
using System.Text.Json;

namespace GestionConvocatorias.Identity.Api.Services;

public class GitHubService
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly string _token;
    private readonly string _organization;
    private readonly ILogger<GitHubService> _logger;

    public GitHubService(IConfiguration config, IHttpClientFactory httpClientFactory, ILogger<GitHubService> logger)
    {
        _token = config["GitHub:Token"] ?? throw new InvalidOperationException("GitHub Token no configurado.");
        _organization = config["GitHub:Organization"] ?? throw new InvalidOperationException("GitHub Organization no configurada.");
        _httpClientFactory = httpClientFactory;
        _logger = logger;
    }

    private HttpClient CrearCliente()
    {
        var client = _httpClientFactory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", _token);
        client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/vnd.github+json"));
        client.DefaultRequestHeaders.Add("X-GitHub-Api-Version", "2022-11-28");
        client.DefaultRequestHeaders.UserAgent.Add(new ProductInfoHeaderValue("ConvocaEvalIA", "1.0"));
        return client;
    }

    public async Task<GitHubRepoResult> CrearRepositorioAsync(string nombre, string descripcion)
    {
        var client = CrearCliente();

        var body = new
        {
            name = nombre,
            description = descripcion,
            @private = true,
            auto_init = true,
            gitignore_template = "VisualStudio",
            license_template = "mit"
        };

        var json = JsonSerializer.Serialize(body);
        var content = new StringContent(json, System.Text.Encoding.UTF8, "application/json");

        var response = await client.PostAsync($"https://api.github.com/orgs/{_organization}/repos", content);

        var responseBody = await response.Content.ReadAsStringAsync();

        if (!response.IsSuccessStatusCode)
        {
            _logger.LogError("Error al crear repositorio en GitHub: {StatusCode} - {Body}", response.StatusCode, responseBody);
            throw new Exception($"Error al crear repositorio ({(int)response.StatusCode}): {responseBody}");
        }

        var result = JsonSerializer.Deserialize<JsonElement>(responseBody);

        return new GitHubRepoResult
        {
            HtmlUrl = result.GetProperty("html_url").GetString() ?? "",
            CloneUrl = result.GetProperty("clone_url").GetString() ?? "",
            SshUrl = result.GetProperty("ssh_url").GetString() ?? "",
            FullName = result.GetProperty("full_name").GetString() ?? ""
        };
    }

    public async Task<bool> AgregarColaboradorAsync(string owner, string repo, string username, string permiso = "push")
    {
        var client = CrearCliente();

        var body = new
        {
            permission = permiso
        };

        var json = JsonSerializer.Serialize(body);
        var content = new StringContent(json, System.Text.Encoding.UTF8, "application/json");

        var response = await client.PutAsync(
            $"https://api.github.com/repos/{owner}/{repo}/collaborators/{username}",
            content);

        return response.IsSuccessStatusCode;
    }
}

public class GitHubRepoResult
{
    public string HtmlUrl { get; set; } = string.Empty;
    public string CloneUrl { get; set; } = string.Empty;
    public string SshUrl { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
}
