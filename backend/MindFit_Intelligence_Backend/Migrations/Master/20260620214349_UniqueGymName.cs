using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MindFit_Intelligence_Backend.Migrations.Master
{
    /// <inheritdoc />
    public partial class UniqueGymName : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_Gym_NombreGym",
                table: "Gym",
                column: "NombreGym",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Gym_NombreGym",
                table: "Gym");
        }
    }
}
