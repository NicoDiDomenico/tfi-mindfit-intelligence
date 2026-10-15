using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using MindFit_Intelligence_Backend.Models;

#nullable disable

namespace MindFit_Intelligence_Backend.Migrations
{
    /// <inheritdoc />
    [DbContext(typeof(MindFitIntelligenceContext))]
    [Migration("20260712190000_AddPlanAlimenticioPerfilIA")]
    public partial class AddPlanAlimenticioPerfilIA : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "PlanAlimenticio",
                table: "PerfilIA",
                type: "varchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PlanAlimenticio",
                table: "PerfilIA");
        }
    }
}
