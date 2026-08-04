using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GestionConvocatorias.Identity.Api.Migrations
{
    /// <inheritdoc />
    public partial class AgregarCamposCodigoFuente : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "GitHubUrl",
                table: "Proyectos",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "RutaCodigoFuente",
                table: "Proyectos",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "GitHubUrl",
                table: "Proyectos");

            migrationBuilder.DropColumn(
                name: "RutaCodigoFuente",
                table: "Proyectos");
        }
    }
}
