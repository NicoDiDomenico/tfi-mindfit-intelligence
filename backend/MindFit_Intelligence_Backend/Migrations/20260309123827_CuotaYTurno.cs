using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MindFit_Intelligence_Backend.Migrations
{
    /// <inheritdoc />
    public partial class CuotaYTurno : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Cuota",
                columns: table => new
                {
                    IdCuota = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    IdUsuario = table.Column<int>(type: "int", nullable: false),
                    Plan = table.Column<string>(type: "varchar(50)", nullable: false),
                    FechaInicioPeriodo = table.Column<DateTime>(type: "date", nullable: false),
                    FechaFinPeriodo = table.Column<DateTime>(type: "date", nullable: false),
                    Monto = table.Column<decimal>(type: "decimal(10,2)", nullable: false),
                    EstadoCuota = table.Column<string>(type: "varchar(50)", nullable: false),
                    FechaPago = table.Column<DateTime>(type: "date", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Cuota", x => x.IdCuota);
                    table.ForeignKey(
                        name: "FK_Cuota_PersonaSocio_IdUsuario",
                        column: x => x.IdUsuario,
                        principalTable: "PersonaSocio",
                        principalColumn: "IdUsuario",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "RangoHorario",
                columns: table => new
                {
                    IdRangoHorario = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    HoraDesde = table.Column<TimeSpan>(type: "time", nullable: false),
                    HoraHasta = table.Column<TimeSpan>(type: "time", nullable: false),
                    CupoMaximo = table.Column<int>(type: "int", nullable: false),
                    Activo = table.Column<bool>(type: "bit", nullable: false),
                    IdDia = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RangoHorario", x => x.IdRangoHorario);
                    table.ForeignKey(
                        name: "FK_RangoHorario_Dia_IdDia",
                        column: x => x.IdDia,
                        principalTable: "Dia",
                        principalColumn: "IdDia",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "CupoFecha",
                columns: table => new
                {
                    IdCupoFecha = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    IdRangoHorario = table.Column<int>(type: "int", nullable: false),
                    Fecha = table.Column<DateTime>(type: "date", nullable: false),
                    CupoActual = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CupoFecha", x => x.IdCupoFecha);
                    table.ForeignKey(
                        name: "FK_CupoFecha_RangoHorario_IdRangoHorario",
                        column: x => x.IdRangoHorario,
                        principalTable: "RangoHorario",
                        principalColumn: "IdRangoHorario",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "RangoHorarioResponsable",
                columns: table => new
                {
                    IdRangoHorario = table.Column<int>(type: "int", nullable: false),
                    IdUsuarioResponsable = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RangoHorarioResponsable", x => new { x.IdRangoHorario, x.IdUsuarioResponsable });
                    table.ForeignKey(
                        name: "FK_RangoHorarioResponsable_PersonaResponsable_IdUsuarioResponsable",
                        column: x => x.IdUsuarioResponsable,
                        principalTable: "PersonaResponsable",
                        principalColumn: "IdUsuario",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_RangoHorarioResponsable_RangoHorario_IdRangoHorario",
                        column: x => x.IdRangoHorario,
                        principalTable: "RangoHorario",
                        principalColumn: "IdRangoHorario",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Turno",
                columns: table => new
                {
                    IdTurno = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    IdUsuarioResponsable = table.Column<int>(type: "int", nullable: false),
                    IdUsuarioSocio = table.Column<int>(type: "int", nullable: false),
                    IdCupoFecha = table.Column<int>(type: "int", nullable: false),
                    FechaAlta = table.Column<DateTime>(type: "date", nullable: false),
                    EstadoTurno = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Turno", x => x.IdTurno);
                    table.ForeignKey(
                        name: "FK_Turno_CupoFecha_IdCupoFecha",
                        column: x => x.IdCupoFecha,
                        principalTable: "CupoFecha",
                        principalColumn: "IdCupoFecha",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Turno_PersonaResponsable_IdUsuarioResponsable",
                        column: x => x.IdUsuarioResponsable,
                        principalTable: "PersonaResponsable",
                        principalColumn: "IdUsuario",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Turno_PersonaSocio_IdUsuarioSocio",
                        column: x => x.IdUsuarioSocio,
                        principalTable: "PersonaSocio",
                        principalColumn: "IdUsuario",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Cuota_IdUsuario",
                table: "Cuota",
                column: "IdUsuario");

            migrationBuilder.CreateIndex(
                name: "IX_CupoFecha_IdRangoHorario",
                table: "CupoFecha",
                column: "IdRangoHorario");

            migrationBuilder.CreateIndex(
                name: "IX_RangoHorario_IdDia",
                table: "RangoHorario",
                column: "IdDia");

            migrationBuilder.CreateIndex(
                name: "IX_RangoHorarioResponsable_IdUsuarioResponsable",
                table: "RangoHorarioResponsable",
                column: "IdUsuarioResponsable");

            migrationBuilder.CreateIndex(
                name: "IX_Turno_IdCupoFecha",
                table: "Turno",
                column: "IdCupoFecha");

            migrationBuilder.CreateIndex(
                name: "IX_Turno_IdUsuarioResponsable",
                table: "Turno",
                column: "IdUsuarioResponsable");

            migrationBuilder.CreateIndex(
                name: "IX_Turno_IdUsuarioSocio",
                table: "Turno",
                column: "IdUsuarioSocio");

            migrationBuilder.Sql(@"
                INSERT INTO Cuota (IdUsuario, [Plan], FechaInicioPeriodo, FechaFinPeriodo, Monto, EstadoCuota)
                SELECT IdUsuario, [Plan], GETDATE(), ISNULL(FechaFinActividades, GETDATE()), 0, 'Vencida'
                FROM PersonaSocio
            ");

            migrationBuilder.DropColumn(
                name: "FechaFinActividades",
                table: "PersonaSocio");

            migrationBuilder.DropColumn(
                name: "Plan",
                table: "PersonaSocio");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Cuota");

            migrationBuilder.DropTable(
                name: "RangoHorarioResponsable");

            migrationBuilder.DropTable(
                name: "Turno");

            migrationBuilder.DropTable(
                name: "CupoFecha");

            migrationBuilder.DropTable(
                name: "RangoHorario");

            migrationBuilder.AddColumn<DateTime>(
                name: "FechaFinActividades",
                table: "PersonaSocio",
                type: "date",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Plan",
                table: "PersonaSocio",
                type: "varchar(50)",
                nullable: false,
                defaultValue: "");
        }
    }
}
