using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MindFit_Intelligence_Backend.Migrations
{
    /// <inheritdoc />
    public partial class MejoraLogicaTurno : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_CupoFecha_RangoHorario_IdRangoHorario",
                table: "CupoFecha");

            migrationBuilder.DropForeignKey(
                name: "FK_RangoHorario_Dia_IdDia",
                table: "RangoHorario");

            migrationBuilder.DropTable(
                name: "RangoHorarioResponsable");

            migrationBuilder.DropIndex(
                name: "IX_RangoHorario_IdDia",
                table: "RangoHorario");

            migrationBuilder.DropIndex(
                name: "IX_CupoFecha_IdRangoHorario",
                table: "CupoFecha");

            migrationBuilder.DropColumn(
                name: "Activo",
                table: "RangoHorario");

            migrationBuilder.DropColumn(
                name: "CupoMaximo",
                table: "RangoHorario");

            migrationBuilder.DropColumn(
                name: "IdDia",
                table: "RangoHorario");

            migrationBuilder.RenameColumn(
                name: "IdRangoHorario",
                table: "CupoFecha",
                newName: "IdDiaRangoHorario");

            migrationBuilder.CreateTable(
                name: "DiaRangoHorario",
                columns: table => new
                {
                    IdDiaRangoHorario = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    CupoMaximo = table.Column<int>(type: "int", nullable: false),
                    Activo = table.Column<bool>(type: "bit", nullable: false),
                    IdRangoHorario = table.Column<int>(type: "int", nullable: false),
                    IdDia = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DiaRangoHorario", x => x.IdDiaRangoHorario);
                    table.ForeignKey(
                        name: "FK_DiaRangoHorario_Dia_IdDia",
                        column: x => x.IdDia,
                        principalTable: "Dia",
                        principalColumn: "IdDia",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_DiaRangoHorario_RangoHorario_IdRangoHorario",
                        column: x => x.IdRangoHorario,
                        principalTable: "RangoHorario",
                        principalColumn: "IdRangoHorario",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "DiaRangoHorarioResponsable",
                columns: table => new
                {
                    IdDiaRangoHorarioResponsable = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    IdDiaRangoHorario = table.Column<int>(type: "int", nullable: false),
                    IdUsuarioResponsable = table.Column<int>(type: "int", nullable: false),
                    Activo = table.Column<bool>(type: "bit", nullable: false),
                    Observaciones = table.Column<string>(type: "varchar(255)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DiaRangoHorarioResponsable", x => x.IdDiaRangoHorarioResponsable);
                    table.ForeignKey(
                        name: "FK_DiaRangoHorarioResponsable_DiaRangoHorario_IdDiaRangoHorario",
                        column: x => x.IdDiaRangoHorario,
                        principalTable: "DiaRangoHorario",
                        principalColumn: "IdDiaRangoHorario",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_DiaRangoHorarioResponsable_PersonaResponsable_IdUsuarioResponsable",
                        column: x => x.IdUsuarioResponsable,
                        principalTable: "PersonaResponsable",
                        principalColumn: "IdUsuario",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_RangoHorario_HoraDesde_HoraHasta",
                table: "RangoHorario",
                columns: new[] { "HoraDesde", "HoraHasta" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_CupoFecha_IdDiaRangoHorario_Fecha",
                table: "CupoFecha",
                columns: new[] { "IdDiaRangoHorario", "Fecha" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_DiaRangoHorario_IdDia_IdRangoHorario",
                table: "DiaRangoHorario",
                columns: new[] { "IdDia", "IdRangoHorario" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_DiaRangoHorario_IdRangoHorario",
                table: "DiaRangoHorario",
                column: "IdRangoHorario");

            migrationBuilder.CreateIndex(
                name: "IX_DiaRangoHorarioResponsable_IdDiaRangoHorario_IdUsuarioResponsable",
                table: "DiaRangoHorarioResponsable",
                columns: new[] { "IdDiaRangoHorario", "IdUsuarioResponsable" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_DiaRangoHorarioResponsable_IdUsuarioResponsable",
                table: "DiaRangoHorarioResponsable",
                column: "IdUsuarioResponsable");

            migrationBuilder.AddForeignKey(
                name: "FK_CupoFecha_DiaRangoHorario_IdDiaRangoHorario",
                table: "CupoFecha",
                column: "IdDiaRangoHorario",
                principalTable: "DiaRangoHorario",
                principalColumn: "IdDiaRangoHorario",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_CupoFecha_DiaRangoHorario_IdDiaRangoHorario",
                table: "CupoFecha");

            migrationBuilder.DropTable(
                name: "DiaRangoHorarioResponsable");

            migrationBuilder.DropTable(
                name: "DiaRangoHorario");

            migrationBuilder.DropIndex(
                name: "IX_RangoHorario_HoraDesde_HoraHasta",
                table: "RangoHorario");

            migrationBuilder.DropIndex(
                name: "IX_CupoFecha_IdDiaRangoHorario_Fecha",
                table: "CupoFecha");

            migrationBuilder.RenameColumn(
                name: "IdDiaRangoHorario",
                table: "CupoFecha",
                newName: "IdRangoHorario");

            migrationBuilder.AddColumn<bool>(
                name: "Activo",
                table: "RangoHorario",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<int>(
                name: "CupoMaximo",
                table: "RangoHorario",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "IdDia",
                table: "RangoHorario",
                type: "int",
                nullable: false,
                defaultValue: 0);

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

            migrationBuilder.CreateIndex(
                name: "IX_RangoHorario_IdDia",
                table: "RangoHorario",
                column: "IdDia");

            migrationBuilder.CreateIndex(
                name: "IX_CupoFecha_IdRangoHorario",
                table: "CupoFecha",
                column: "IdRangoHorario");

            migrationBuilder.CreateIndex(
                name: "IX_RangoHorarioResponsable_IdUsuarioResponsable",
                table: "RangoHorarioResponsable",
                column: "IdUsuarioResponsable");

            migrationBuilder.AddForeignKey(
                name: "FK_CupoFecha_RangoHorario_IdRangoHorario",
                table: "CupoFecha",
                column: "IdRangoHorario",
                principalTable: "RangoHorario",
                principalColumn: "IdRangoHorario",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_RangoHorario_Dia_IdDia",
                table: "RangoHorario",
                column: "IdDia",
                principalTable: "Dia",
                principalColumn: "IdDia",
                onDelete: ReferentialAction.Restrict);
        }
    }
}
