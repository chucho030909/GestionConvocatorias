using FluentAssertions;
using GestionConvocatorias.Identity.Api.Controllers;
using GestionConvocatorias.Identity.Api.Data;
using GestionConvocatorias.Identity.Api.Models;
using GestionConvocatorias.Identity.Api.Services;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.AspNetCore.Mvc;
using Moq;
using Xunit;

namespace GestionConvocatorias.Tests;

public class AuthControllerTests
{
    private readonly AppDbContext _context;
    private readonly Mock<UserManager<Usuario>> _userManagerMock;
    private readonly Mock<SignInManager<Usuario>> _signInManagerMock;
    private readonly Mock<IConfiguration> _configMock;
    private readonly Mock<ILogger<AuthController>> _loggerMock;
    private readonly Mock<IEmailService> _emailServiceMock;
    private readonly Mock<IArchivoService> _archivoServiceMock;
    private readonly AuthController _controller;

    public AuthControllerTests()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        _context = new AppDbContext(options);

        var store = new Mock<IUserStore<Usuario>>();
        _userManagerMock = new Mock<UserManager<Usuario>>(
            store.Object, null!, null!, null!, null!, null!, null!, null!, null!);

        var contextAccessor = new Mock<Microsoft.AspNetCore.Http.IHttpContextAccessor>();
        var userPrincipalFactory = new Mock<IUserClaimsPrincipalFactory<Usuario>>();
        _signInManagerMock = new Mock<SignInManager<Usuario>>(
            _userManagerMock.Object, contextAccessor.Object, userPrincipalFactory.Object, null!, null!, null!, null!);

        _configMock = new Mock<IConfiguration>();
        _configMock.Setup(c => c["Jwt:Key"]).Returns("TestKey123456789012345678901234567890");
        _configMock.Setup(c => c["Jwt:Issuer"]).Returns("TestIssuer");
        _configMock.Setup(c => c["Jwt:Audience"]).Returns("TestAudience");
        _configMock.Setup(c => c["Jwt:ExpiracionMinutos"]).Returns("60");

        _loggerMock = new Mock<ILogger<AuthController>>();
        _emailServiceMock = new Mock<IEmailService>();
        _archivoServiceMock = new Mock<IArchivoService>();

        _controller = new AuthController(
            _context,
            _configMock.Object,
            _userManagerMock.Object,
            _signInManagerMock.Object,
            _emailServiceMock.Object,
            _archivoServiceMock.Object);
    }

    [Fact]
    public async Task Login_CredencialesInvalidas_RetornaUnauthorized()
    {
        // Arrange
        _userManagerMock.Setup(u => u.FindByEmailAsync(It.IsAny<string>()))
            .ReturnsAsync((Usuario?)null);

        var dto = new Identity.Api.DTOs.LoginDto
        {
            CorreoElectronico = "test@test.com",
            Password = "wrong"
        };

        // Act
        var result = await _controller.Login(dto);

        // Assert
        result.Should().BeOfType<UnauthorizedObjectResult>();
    }

    [Fact]
    public void Roles_TodosContieneTodosLosRoles()
    {
        // Act & Assert
        Roles.Todos.Should().Contain("Administrador");
        Roles.Todos.Should().Contain("Coordinador");
        Roles.Todos.Should().Contain("DocenteAsesor");
        Roles.Todos.Should().Contain("Estudiante");
        Roles.Todos.Should().Contain("Evaluador");
    }

    [Fact]
    public void EstadoProyecto_TieneValoresEsperados()
    {
        // Act & Assert
        Enum.IsDefined(typeof(EstadoProyecto), 0).Should().BeTrue(); // Borrador
        Enum.IsDefined(typeof(EstadoProyecto), 1).Should().BeTrue(); // EnPropuesta
        Enum.IsDefined(typeof(EstadoProyecto), 2).Should().BeTrue(); // EnRevision
        Enum.IsDefined(typeof(EstadoProyecto), 3).Should().BeTrue(); // Aprobado
        Enum.IsDefined(typeof(EstadoProyecto), 4).Should().BeTrue(); // EnDesarrollo
        Enum.IsDefined(typeof(EstadoProyecto), 5).Should().BeTrue(); // Finalizado
        Enum.IsDefined(typeof(EstadoProyecto), 6).Should().BeTrue(); // Cancelado
    }

    [Fact]
    public void EstadoInvitacion_TieneValoresEsperados()
    {
        // Act & Assert
        Enum.IsDefined(typeof(EstadoInvitacion), 0).Should().BeTrue(); // Pendiente
        Enum.IsDefined(typeof(EstadoInvitacion), 1).Should().BeTrue(); // Aceptada
        Enum.IsDefined(typeof(EstadoInvitacion), 2).Should().BeTrue(); // Rechazada
        Enum.IsDefined(typeof(EstadoInvitacion), 3).Should().BeTrue(); // Expirada
    }
}
