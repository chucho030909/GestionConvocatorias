using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GestionConvocatorias.Identity.Api.Migrations
{
    /// <inheritdoc />
    public partial class AgregarConvocatoriaEstudiantes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ConvocatoriaEstudiantes",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ConvocatoriaId = table.Column<int>(type: "int", nullable: false),
                    UsuarioId = table.Column<int>(type: "int", nullable: false),
                    FechaRegistro = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ConvocatoriaEstudiantes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ConvocatoriaEstudiantes_AspNetUsers_UsuarioId",
                        column: x => x.UsuarioId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ConvocatoriaEstudiantes_Convocatorias_ConvocatoriaId",
                        column: x => x.ConvocatoriaId,
                        principalTable: "Convocatorias",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ConvocatoriaEstudiantes_ConvocatoriaId_UsuarioId",
                table: "ConvocatoriaEstudiantes",
                columns: new[] { "ConvocatoriaId", "UsuarioId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ConvocatoriaEstudiantes_UsuarioId",
                table: "ConvocatoriaEstudiantes",
                column: "UsuarioId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ConvocatoriaEstudiantes");
        }
    }
}
