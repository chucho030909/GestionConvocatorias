using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GestionConvocatorias.Identity.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddConvocatoriaConsecutivo : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ConvocatoriaConsecutivos",
                columns: table => new
                {
                    Anio = table.Column<int>(type: "integer", nullable: false),
                    UltimoNumero = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ConvocatoriaConsecutivos", x => x.Anio);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ConvocatoriaConsecutivos");
        }
    }
}
