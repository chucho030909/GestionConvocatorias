using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GestionConvocatorias.Identity.Api.Migrations
{
    /// <inheritdoc />
    public partial class AgregarEvaluacionesYNuevoEstado : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "CalificacionInvestigacion",
                table: "Evaluaciones",
                newName: "CalificacionSustentabilidad");

            migrationBuilder.RenameColumn(
                name: "CalificacionDocumentacion",
                table: "Evaluaciones",
                newName: "CalificacionModeloNegocio");

            migrationBuilder.AddColumn<int>(
                name: "CalificacionImpactoSocial",
                table: "Evaluaciones",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<decimal>(
                name: "PuntajeTotal",
                table: "Evaluaciones",
                type: "decimal(5,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.CreateTable(
                name: "InvitacionesEvaluador",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Correo = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Token = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    FechaCreacion = table.Column<DateTime>(type: "datetime2", nullable: false),
                    FechaExpiracion = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Estado = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_InvitacionesEvaluador", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_InvitacionesEvaluador_Token",
                table: "InvitacionesEvaluador",
                column: "Token",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "InvitacionesEvaluador");

            migrationBuilder.DropColumn(
                name: "CalificacionImpactoSocial",
                table: "Evaluaciones");

            migrationBuilder.DropColumn(
                name: "PuntajeTotal",
                table: "Evaluaciones");

            migrationBuilder.RenameColumn(
                name: "CalificacionSustentabilidad",
                table: "Evaluaciones",
                newName: "CalificacionInvestigacion");

            migrationBuilder.RenameColumn(
                name: "CalificacionModeloNegocio",
                table: "Evaluaciones",
                newName: "CalificacionDocumentacion");
        }
    }
}
