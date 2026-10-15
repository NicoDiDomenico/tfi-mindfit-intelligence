using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MindFit_Intelligence_Backend.Migrations
{
    /// <inheritdoc />
    public partial class Formulario : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Formulario",
                columns: table => new
                {
                    IdFormulario = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    NombreFormulario = table.Column<string>(type: "varchar(100)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Formulario", x => x.IdFormulario);
                });

            migrationBuilder.CreateTable(
                name: "FormularioPermiso",
                columns: table => new
                {
                    IdFormulario = table.Column<int>(type: "int", nullable: false),
                    IdPermiso = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FormularioPermiso", x => new { x.IdFormulario, x.IdPermiso });
                    table.ForeignKey(
                        name: "FK_FormularioPermiso_Formulario_IdFormulario",
                        column: x => x.IdFormulario,
                        principalTable: "Formulario",
                        principalColumn: "IdFormulario",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_FormularioPermiso_Permiso_IdPermiso",
                        column: x => x.IdPermiso,
                        principalTable: "Permiso",
                        principalColumn: "IdPermiso",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Formulario_NombreFormulario",
                table: "Formulario",
                column: "NombreFormulario",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_FormularioPermiso_IdPermiso",
                table: "FormularioPermiso",
                column: "IdPermiso");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "FormularioPermiso");

            migrationBuilder.DropTable(
                name: "Formulario");
        }
    }
}
