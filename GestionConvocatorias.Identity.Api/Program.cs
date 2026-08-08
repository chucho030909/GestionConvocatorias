using GestionConvocatorias.Identity.Api.Data;
using GestionConvocatorias.Identity.Api.Middlewares;
using GestionConvocatorias.Identity.Api.Models;
using GestionConvocatorias.Identity.Api.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;
using Scalar.AspNetCore;
using System.Collections.Generic;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers().AddJsonOptions(options =>
{
    options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
    options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
});

// Configuración de Entity Framework Core
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
// Allow override via environment variable (for Render)
var envConnectionString = Environment.GetEnvironmentVariable("DATABASE_URL");
if (!string.IsNullOrEmpty(envConnectionString))
{
    // Render provides DATABASE_URL in PostgreSQL URL format, convert to Npgsql connection string
    var uri = new Uri(envConnectionString);
    var userInfo = uri.UserInfo.Split(':');
    var host = uri.Host;
    var dbPort = uri.Port;
    // Default to 5432 if port is -1 (not specified in URI)
    if (dbPort <= 0) dbPort = 5432;
    var database = uri.AbsolutePath.Trim('/');
    var username = userInfo[0];
    var password = userInfo[1];
    connectionString = $"Host={host};Port={dbPort};Database={database};Username={username};Password={password};SSL Mode=Require;";
}
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(connectionString));

// Configuración de Identity con roles
builder.Services.AddIdentity<Usuario, IdentityRole<int>>()
    .AddEntityFrameworkStores<AppDbContext>()
    .AddDefaultTokenProviders();

// Configuración de autenticación y autorización JWT
var jwtKey = builder.Configuration["Jwt:Key"] ?? throw new InvalidOperationException("Falta la configuración Jwt:Key");
var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? throw new InvalidOperationException("Falta la configuración Jwt:Issuer");
var jwtAudience = builder.Configuration["Jwt:Audience"] ?? throw new InvalidOperationException("Falta la configuración Jwt:Audience");

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultScheme = JwtBearerDefaults.AuthenticationScheme;
})
    .AddJwtBearer(options =>
    {
        options.MapInboundClaims = false;
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtIssuer,
            ValidAudience = jwtAudience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
        };
    });

builder.Services.AddAuthorization();

// Configuración de CORS (solo permite el frontend)
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        string[] allowedOrigins;
        var envOrigins = Environment.GetEnvironmentVariable("Cors__AllowedOrigins");
        if (!string.IsNullOrEmpty(envOrigins))
        {
            // Try JSON array first: ["url1","url2"]
            try
            {
                allowedOrigins = System.Text.Json.JsonSerializer.Deserialize<string[]>(envOrigins)!;
            }
            catch
            {
                // Fallback: comma-separated or plain URL
                allowedOrigins = envOrigins
                    .Replace("[", "").Replace("]", "").Replace("\"", "")
                    .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
            }
        }
        else
        {
            allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
                ?? new[] { "http://localhost:5173" };
        }
        policy.WithOrigins(allowedOrigins);
        policy.AllowAnyMethod();
        policy.AllowAnyHeader();
        policy.AllowCredentials();
    });
});

// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.Http,
        Description = "Ingrese el token JWT en el formato: Bearer {token}"
    });

    options.AddSecurityRequirement(document =>
    {
        var requirement = new OpenApiSecurityRequirement();
        requirement.Add(new OpenApiSecuritySchemeReference("Bearer", document, null), new List<string>());
        return requirement;
    });
});

builder.Services.AddHostedService<AlertaRetrasosService>();
builder.Services.AddScoped<IEmailService, EmailService>();
builder.Services.AddScoped<IArchivoService, ArchivoService>();
builder.Services.AddHttpClient();
builder.Services.AddScoped<GitHubService>();
builder.Services.AddHealthChecks();

var app = builder.Build();

// Configure URLs from environment (supports Render's PORT binding)
var port = Environment.GetEnvironmentVariable("PORT") ?? "5000";
app.Urls.Add($"http://*:{port}");

// Población inicial de la base de datos (solo si está vacía)
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole<int>>>();
    var userManager = scope.ServiceProvider.GetRequiredService<UserManager<Usuario>>();
    await context.Database.MigrateAsync();
    if (!await context.Users.AnyAsync())
    {
        await DbSeeder.SeedAsync(context, roleManager, userManager);
    }
}

// Configure the HTTP request pipeline.
app.UseMiddleware<ExceptionHandlingMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    // Activa la interfaz gráfica interactiva. Al correr la app, entra a /scalar/v1 en tu navegador
    app.MapScalarApiReference();

    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseStaticFiles();

app.UseCors();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapHealthChecks("/health");

app.Run();