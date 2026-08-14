using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GestionConvocatorias.Identity.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddNombreOriginalArchivos : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "NombreOriginalBases",
                table: "Convocatorias",
                type: "TEXT",
                maxLength: 256,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "NombreOriginalConvocatoriaPDF",
                table: "Convocatorias",
                type: "TEXT",
                maxLength: 256,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "NombresOriginalesFormatos",
                table: "Convocatorias",
                type: "TEXT",
                maxLength: 2000,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "NombreOriginalBases",
                table: "Convocatorias");

            migrationBuilder.DropColumn(
                name: "NombreOriginalConvocatoriaPDF",
                table: "Convocatorias");

            migrationBuilder.DropColumn(
                name: "NombresOriginalesFormatos",
                table: "Convocatorias");
        }
    }
}
