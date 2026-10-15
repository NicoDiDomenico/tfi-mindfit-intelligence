using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MindFit_Intelligence_Backend.Migrations
{
    /// <inheritdoc />
    public partial class Historial : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "RutinaHistorial",
                columns: table => new
                {
                    IdRutinaHistorial = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    IdRutina = table.Column<int>(type: "int", nullable: false),
                    Version = table.Column<int>(type: "int", nullable: false),
                    FechaSnapshot = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ActivoSnapshot = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RutinaHistorial", x => x.IdRutinaHistorial);
                    table.ForeignKey(
                        name: "FK_RutinaHistorial_Rutina_IdRutina",
                        column: x => x.IdRutina,
                        principalTable: "Rutina",
                        principalColumn: "IdRutina",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "RutinaHistorialCalentamiento",
                columns: table => new
                {
                    IdRutinaHistorialCalentamiento = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    IdRutinaHistorial = table.Column<int>(type: "int", nullable: false),
                    IdEjercicio = table.Column<int>(type: "int", nullable: false),
                    Duracion = table.Column<int>(type: "int", nullable: false),
                    Orden = table.Column<int>(type: "int", nullable: false),
                    Observaciones = table.Column<string>(type: "VARCHAR(200)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RutinaHistorialCalentamiento", x => x.IdRutinaHistorialCalentamiento);
                    table.ForeignKey(
                        name: "FK_RutinaHistorialCalentamiento_RutinaHistorial_IdRutinaHistorial",
                        column: x => x.IdRutinaHistorial,
                        principalTable: "RutinaHistorial",
                        principalColumn: "IdRutinaHistorial",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "RutinaHistorialEntrenamiento",
                columns: table => new
                {
                    IdRutinaHistorialEntrenamiento = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    IdRutinaHistorial = table.Column<int>(type: "int", nullable: false),
                    IdEjercicio = table.Column<int>(type: "int", nullable: false),
                    Series = table.Column<int>(type: "int", nullable: false),
                    Repeticiones = table.Column<int>(type: "int", nullable: false),
                    PesoAsignado = table.Column<decimal>(type: "DECIMAL(18,2)", nullable: true),
                    TiempoDescansoSegundos = table.Column<int>(type: "int", nullable: true),
                    Orden = table.Column<int>(type: "int", nullable: false),
                    Observaciones = table.Column<string>(type: "VARCHAR(200)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RutinaHistorialEntrenamiento", x => x.IdRutinaHistorialEntrenamiento);
                    table.ForeignKey(
                        name: "FK_RutinaHistorialEntrenamiento_RutinaHistorial_IdRutinaHistorial",
                        column: x => x.IdRutinaHistorial,
                        principalTable: "RutinaHistorial",
                        principalColumn: "IdRutinaHistorial",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "RutinaHistorialEstiramiento",
                columns: table => new
                {
                    IdRutinaHistorialEstiramiento = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    IdRutinaHistorial = table.Column<int>(type: "int", nullable: false),
                    IdEjercicio = table.Column<int>(type: "int", nullable: false),
                    Duracion = table.Column<int>(type: "int", nullable: false),
                    Orden = table.Column<int>(type: "int", nullable: false),
                    Observaciones = table.Column<string>(type: "VARCHAR(200)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RutinaHistorialEstiramiento", x => x.IdRutinaHistorialEstiramiento);
                    table.ForeignKey(
                        name: "FK_RutinaHistorialEstiramiento_RutinaHistorial_IdRutinaHistorial",
                        column: x => x.IdRutinaHistorial,
                        principalTable: "RutinaHistorial",
                        principalColumn: "IdRutinaHistorial",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_RutinaHistorial_IdRutina_Version",
                table: "RutinaHistorial",
                columns: new[] { "IdRutina", "Version" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_RutinaHistorialCalentamiento_IdRutinaHistorial",
                table: "RutinaHistorialCalentamiento",
                column: "IdRutinaHistorial");

            migrationBuilder.CreateIndex(
                name: "IX_RutinaHistorialEntrenamiento_IdRutinaHistorial",
                table: "RutinaHistorialEntrenamiento",
                column: "IdRutinaHistorial");

            migrationBuilder.CreateIndex(
                name: "IX_RutinaHistorialEstiramiento_IdRutinaHistorial",
                table: "RutinaHistorialEstiramiento",
                column: "IdRutinaHistorial");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "RutinaHistorialCalentamiento");

            migrationBuilder.DropTable(
                name: "RutinaHistorialEntrenamiento");

            migrationBuilder.DropTable(
                name: "RutinaHistorialEstiramiento");

            migrationBuilder.DropTable(
                name: "RutinaHistorial");
        }
    }
}
