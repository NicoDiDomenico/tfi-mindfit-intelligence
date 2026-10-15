using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MindFit_Intelligence_Backend.Migrations
{
    /// <inheritdoc />
    public partial class AmpliarPerfilIAParaRecomendaciones : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "CondicionesMedicasRelevantes",
                table: "PerfilIA",
                type: "varchar(500)",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "DuracionSesionMinutos",
                table: "PerfilIA",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "FechaActualizacion",
                table: "PerfilIA",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "IntensidadPreferida",
                table: "PerfilIA",
                type: "varchar(100)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "LesionesLimitaciones",
                table: "PerfilIA",
                type: "varchar(500)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "NotasEntrenador",
                table: "PerfilIA",
                type: "varchar(500)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CondicionesMedicasRelevantes",
                table: "PerfilIA");

            migrationBuilder.DropColumn(
                name: "DuracionSesionMinutos",
                table: "PerfilIA");

            migrationBuilder.DropColumn(
                name: "FechaActualizacion",
                table: "PerfilIA");

            migrationBuilder.DropColumn(
                name: "IntensidadPreferida",
                table: "PerfilIA");

            migrationBuilder.DropColumn(
                name: "LesionesLimitaciones",
                table: "PerfilIA");

            migrationBuilder.DropColumn(
                name: "NotasEntrenador",
                table: "PerfilIA");
        }
    }
}
