using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GestionConvocatorias.Identity.Api.Migrations
{
    /// <inheritdoc />
    public partial class AgregarCamposArchivos : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "RutaPropuestaPDF",
                table: "Proyectos",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "RutaDocumento",
                table: "Avances",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "RutaPropuestaPDF",
                table: "Proyectos");

            migrationBuilder.DropColumn(
                name: "RutaDocumento",
                table: "Avances");
        }
    }
}
