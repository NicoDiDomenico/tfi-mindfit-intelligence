using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MindFit_Intelligence_Backend.Migrations
{
    /// <inheritdoc />
    public partial class AgregadoModuloEjerciciosFinal : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Equipamiento",
                columns: table => new
                {
                    IdEquipamiento = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    NombreEquipo = table.Column<string>(type: "VARCHAR(50)", nullable: false),
                    CostoAdquisicion = table.Column<decimal>(type: "DECIMAL(18,2)", nullable: false),
                    PesoFijoKg = table.Column<decimal>(type: "DECIMAL(18,2)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Equipamiento", x => x.IdEquipamiento);
                });

            migrationBuilder.CreateTable(
                name: "GrupoMuscular",
                columns: table => new
                {
                    IdGrupoMuscular = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    NombreMusculo = table.Column<string>(type: "VARCHAR(50)", nullable: false),
                    IdMapaAnatomico = table.Column<string>(type: "VARCHAR(50)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GrupoMuscular", x => x.IdGrupoMuscular);
                });

            migrationBuilder.CreateTable(
                name: "Maquina",
                columns: table => new
                {
                    IdMaquina = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    NombreMaquina = table.Column<string>(type: "VARCHAR(50)", nullable: false),
                    FechaFabricacion = table.Column<DateTime>(type: "datetime2", nullable: false),
                    FechaCompra = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CostoAdquisicion = table.Column<decimal>(type: "DECIMAL(18,2)", nullable: false),
                    PesoMaximoLingotera = table.Column<decimal>(type: "DECIMAL(18,2)", nullable: true),
                    EsElectrica = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Maquina", x => x.IdMaquina);
                });

            migrationBuilder.CreateTable(
                name: "TipoEjercicio",
                columns: table => new
                {
                    IdTipoEjercicio = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    NombreTipo = table.Column<string>(type: "VARCHAR(50)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TipoEjercicio", x => x.IdTipoEjercicio);
                });

            migrationBuilder.CreateTable(
                name: "Ejercicio",
                columns: table => new
                {
                    IdEjercicio = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    DescEjercicio = table.Column<string>(type: "VARCHAR(100)", nullable: false),
                    IdGrupoMuscular = table.Column<int>(type: "int", nullable: false),
                    IdTipoEjercicio = table.Column<int>(type: "int", nullable: false),
                    IdMaquina = table.Column<int>(type: "int", nullable: true),
                    IdEquipamiento = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Ejercicio", x => x.IdEjercicio);
                    table.ForeignKey(
                        name: "FK_Ejercicio_Equipamiento_IdEquipamiento",
                        column: x => x.IdEquipamiento,
                        principalTable: "Equipamiento",
                        principalColumn: "IdEquipamiento",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_Ejercicio_GrupoMuscular_IdGrupoMuscular",
                        column: x => x.IdGrupoMuscular,
                        principalTable: "GrupoMuscular",
                        principalColumn: "IdGrupoMuscular",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Ejercicio_Maquina_IdMaquina",
                        column: x => x.IdMaquina,
                        principalTable: "Maquina",
                        principalColumn: "IdMaquina",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_Ejercicio_TipoEjercicio_IdTipoEjercicio",
                        column: x => x.IdTipoEjercicio,
                        principalTable: "TipoEjercicio",
                        principalColumn: "IdTipoEjercicio",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Calentamiento",
                columns: table => new
                {
                    IdCalentamiento = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    IdRutina = table.Column<int>(type: "int", nullable: false),
                    IdEjercicio = table.Column<int>(type: "int", nullable: false),
                    Duracion = table.Column<int>(type: "int", nullable: false),
                    Orden = table.Column<int>(type: "int", nullable: false),
                    Observaciones = table.Column<string>(type: "VARCHAR(200)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Calentamiento", x => x.IdCalentamiento);
                    table.ForeignKey(
                        name: "FK_Calentamiento_Ejercicio_IdEjercicio",
                        column: x => x.IdEjercicio,
                        principalTable: "Ejercicio",
                        principalColumn: "IdEjercicio",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Calentamiento_Rutina_IdRutina",
                        column: x => x.IdRutina,
                        principalTable: "Rutina",
                        principalColumn: "IdRutina",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Entrenamiento",
                columns: table => new
                {
                    IdEntrenamiento = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    IdRutina = table.Column<int>(type: "int", nullable: false),
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
                    table.PrimaryKey("PK_Entrenamiento", x => x.IdEntrenamiento);
                    table.ForeignKey(
                        name: "FK_Entrenamiento_Ejercicio_IdEjercicio",
                        column: x => x.IdEjercicio,
                        principalTable: "Ejercicio",
                        principalColumn: "IdEjercicio",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Entrenamiento_Rutina_IdRutina",
                        column: x => x.IdRutina,
                        principalTable: "Rutina",
                        principalColumn: "IdRutina",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Estiramiento",
                columns: table => new
                {
                    IdEstiramiento = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    IdRutina = table.Column<int>(type: "int", nullable: false),
                    IdEjercicio = table.Column<int>(type: "int", nullable: false),
                    Duracion = table.Column<int>(type: "int", nullable: false),
                    Orden = table.Column<int>(type: "int", nullable: false),
                    Observaciones = table.Column<string>(type: "VARCHAR(200)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Estiramiento", x => x.IdEstiramiento);
                    table.ForeignKey(
                        name: "FK_Estiramiento_Ejercicio_IdEjercicio",
                        column: x => x.IdEjercicio,
                        principalTable: "Ejercicio",
                        principalColumn: "IdEjercicio",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Estiramiento_Rutina_IdRutina",
                        column: x => x.IdRutina,
                        principalTable: "Rutina",
                        principalColumn: "IdRutina",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Calentamiento_IdEjercicio",
                table: "Calentamiento",
                column: "IdEjercicio");

            migrationBuilder.CreateIndex(
                name: "IX_Calentamiento_IdRutina",
                table: "Calentamiento",
                column: "IdRutina");

            migrationBuilder.CreateIndex(
                name: "IX_Ejercicio_IdEquipamiento",
                table: "Ejercicio",
                column: "IdEquipamiento");

            migrationBuilder.CreateIndex(
                name: "IX_Ejercicio_IdGrupoMuscular",
                table: "Ejercicio",
                column: "IdGrupoMuscular");

            migrationBuilder.CreateIndex(
                name: "IX_Ejercicio_IdMaquina",
                table: "Ejercicio",
                column: "IdMaquina");

            migrationBuilder.CreateIndex(
                name: "IX_Ejercicio_IdTipoEjercicio",
                table: "Ejercicio",
                column: "IdTipoEjercicio");

            migrationBuilder.CreateIndex(
                name: "IX_Entrenamiento_IdEjercicio",
                table: "Entrenamiento",
                column: "IdEjercicio");

            migrationBuilder.CreateIndex(
                name: "IX_Entrenamiento_IdRutina",
                table: "Entrenamiento",
                column: "IdRutina");

            migrationBuilder.CreateIndex(
                name: "IX_Estiramiento_IdEjercicio",
                table: "Estiramiento",
                column: "IdEjercicio");

            migrationBuilder.CreateIndex(
                name: "IX_Estiramiento_IdRutina",
                table: "Estiramiento",
                column: "IdRutina");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Calentamiento");

            migrationBuilder.DropTable(
                name: "Entrenamiento");

            migrationBuilder.DropTable(
                name: "Estiramiento");

            migrationBuilder.DropTable(
                name: "Ejercicio");

            migrationBuilder.DropTable(
                name: "Equipamiento");

            migrationBuilder.DropTable(
                name: "GrupoMuscular");

            migrationBuilder.DropTable(
                name: "Maquina");

            migrationBuilder.DropTable(
                name: "TipoEjercicio");
        }
    }
}
