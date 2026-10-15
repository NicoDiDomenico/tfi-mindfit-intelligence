using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MindFit_Intelligence_Backend.Migrations
{
    /// <inheritdoc />
    public partial class RestriccionSocioDiaUnico : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Rutina_IdPersonaSocio",
                table: "Rutina");

            migrationBuilder.CreateIndex(
                name: "IX_Rutina_IdPersonaSocio_IdDia",
                table: "Rutina",
                columns: new[] { "IdPersonaSocio", "IdDia" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Rutina_IdPersonaSocio_IdDia",
                table: "Rutina");

            migrationBuilder.CreateIndex(
                name: "IX_Rutina_IdPersonaSocio",
                table: "Rutina",
                column: "IdPersonaSocio");
        }
    }
}
