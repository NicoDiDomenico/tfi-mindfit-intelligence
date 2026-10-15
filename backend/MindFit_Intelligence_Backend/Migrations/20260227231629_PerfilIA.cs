using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MindFit_Intelligence_Backend.Migrations
{
    /// <inheritdoc />
    public partial class PerfilIA : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "PerfilIA",
                columns: table => new
                {
                    IdUsuario = table.Column<int>(type: "int", nullable: false),
                    ObjetivoPrincipal = table.Column<string>(type: "varchar(500)", nullable: true),
                    NivelExperiencia = table.Column<string>(type: "varchar(500)", nullable: true),
                    EjerciciosPreferidos = table.Column<string>(type: "varchar(500)", nullable: true),
                    EjerciciosAEvitar = table.Column<string>(type: "varchar(500)", nullable: true),
                    DisponibilidadHoraria = table.Column<string>(type: "varchar(500)", nullable: true),
                    MotivacionPersonal = table.Column<string>(type: "varchar(500)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PerfilIA", x => x.IdUsuario);
                    table.ForeignKey(
                        name: "FK_PerfilIA_PersonaSocio_IdUsuario",
                        column: x => x.IdUsuario,
                        principalTable: "PersonaSocio",
                        principalColumn: "IdUsuario",
                        onDelete: ReferentialAction.Cascade);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "PerfilIA");
        }
    }
}
