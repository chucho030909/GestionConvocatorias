using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GestionConvocatorias.Identity.Api.Migrations
{
    /// <inheritdoc />
    public partial class ExpandirModelosSegunReglasDeNegocio : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Comentarios");

            migrationBuilder.DropColumn(
                name: "Comentarios",
                table: "Evaluaciones");

            migrationBuilder.AddColumn<string>(
                name: "AreaConocimiento",
                table: "Proyectos",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Folio",
                table: "Proyectos",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Justificacion",
                table: "Proyectos",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Modalidad",
                table: "Proyectos",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "NombreEquipo",
                table: "Proyectos",
                type: "nvarchar(150)",
                maxLength: 150,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Problema",
                table: "Proyectos",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "ObservacionesGenerales",
                table: "Evaluaciones",
                type: "nvarchar(2000)",
                maxLength: 2000,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Categorias",
                table: "Convocatorias",
                type: "nvarchar(2000)",
                maxLength: 2000,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Clave",
                table: "Convocatorias",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "EscalaEvaluacion",
                table: "Convocatorias",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<DateTime>(
                name: "FechaEvaluacion",
                table: "Convocatorias",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<DateTime>(
                name: "FechaLimiteRegistro",
                table: "Convocatorias",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<DateTime>(
                name: "FechaPublicacion",
                table: "Convocatorias",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<DateTime>(
                name: "FechaPublicacionResultados",
                table: "Convocatorias",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<int>(
                name: "NumeroEvaluadoresPorProyecto",
                table: "Convocatorias",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "NumeroMaximoIntegrantes",
                table: "Convocatorias",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "NumeroMaximoProyectos",
                table: "Convocatorias",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "Objetivo",
                table: "Convocatorias",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "RubricaAsignada",
                table: "Convocatorias",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "TipoConvocatoria",
                table: "Convocatorias",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AlterColumn<string>(
                name: "Descripcion",
                table: "Avances",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)");

            migrationBuilder.CreateIndex(
                name: "IX_Proyectos_Folio",
                table: "Proyectos",
                column: "Folio",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Convocatorias_Clave",
                table: "Convocatorias",
                column: "Clave",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Proyectos_Folio",
                table: "Proyectos");

            migrationBuilder.DropIndex(
                name: "IX_Convocatorias_Clave",
                table: "Convocatorias");

            migrationBuilder.DropColumn(
                name: "AreaConocimiento",
                table: "Proyectos");

            migrationBuilder.DropColumn(
                name: "Folio",
                table: "Proyectos");

            migrationBuilder.DropColumn(
                name: "Justificacion",
                table: "Proyectos");

            migrationBuilder.DropColumn(
                name: "Modalidad",
                table: "Proyectos");

            migrationBuilder.DropColumn(
                name: "NombreEquipo",
                table: "Proyectos");

            migrationBuilder.DropColumn(
                name: "Problema",
                table: "Proyectos");

            migrationBuilder.DropColumn(
                name: "ObservacionesGenerales",
                table: "Evaluaciones");

            migrationBuilder.DropColumn(
                name: "Categorias",
                table: "Convocatorias");

            migrationBuilder.DropColumn(
                name: "Clave",
                table: "Convocatorias");

            migrationBuilder.DropColumn(
                name: "EscalaEvaluacion",
                table: "Convocatorias");

            migrationBuilder.DropColumn(
                name: "FechaEvaluacion",
                table: "Convocatorias");

            migrationBuilder.DropColumn(
                name: "FechaLimiteRegistro",
                table: "Convocatorias");

            migrationBuilder.DropColumn(
                name: "FechaPublicacion",
                table: "Convocatorias");

            migrationBuilder.DropColumn(
                name: "FechaPublicacionResultados",
                table: "Convocatorias");

            migrationBuilder.DropColumn(
                name: "NumeroEvaluadoresPorProyecto",
                table: "Convocatorias");

            migrationBuilder.DropColumn(
                name: "NumeroMaximoIntegrantes",
                table: "Convocatorias");

            migrationBuilder.DropColumn(
                name: "NumeroMaximoProyectos",
                table: "Convocatorias");

            migrationBuilder.DropColumn(
                name: "Objetivo",
                table: "Convocatorias");

            migrationBuilder.DropColumn(
                name: "RubricaAsignada",
                table: "Convocatorias");

            migrationBuilder.DropColumn(
                name: "TipoConvocatoria",
                table: "Convocatorias");

            migrationBuilder.AddColumn<string>(
                name: "Comentarios",
                table: "Evaluaciones",
                type: "nvarchar(1000)",
                maxLength: 1000,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AlterColumn<string>(
                name: "Descripcion",
                table: "Avances",
                type: "nvarchar(max)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(500)",
                oldMaxLength: 500);

            migrationBuilder.CreateTable(
                name: "Comentarios",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ProyectoId = table.Column<int>(type: "int", nullable: false),
                    UsuarioId = table.Column<int>(type: "int", nullable: false),
                    Fecha = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Texto = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Comentarios", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Comentarios_AspNetUsers_UsuarioId",
                        column: x => x.UsuarioId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_Comentarios_Proyectos_ProyectoId",
                        column: x => x.ProyectoId,
                        principalTable: "Proyectos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Comentarios_ProyectoId",
                table: "Comentarios",
                column: "ProyectoId");

            migrationBuilder.CreateIndex(
                name: "IX_Comentarios_UsuarioId",
                table: "Comentarios",
                column: "UsuarioId");
        }
    }
}
