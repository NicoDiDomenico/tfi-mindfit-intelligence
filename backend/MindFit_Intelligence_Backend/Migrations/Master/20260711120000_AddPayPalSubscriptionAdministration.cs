using System;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using MindFit_Intelligence_Backend.Models.Master;

#nullable disable

namespace MindFit_Intelligence_Backend.Migrations.Master
{
    /// <inheritdoc />
    [DbContext(typeof(MindFitMasterContext))]
    [Migration("20260711120000_AddPayPalSubscriptionAdministration")]
    public partial class AddPayPalSubscriptionAdministration : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "AccesoBloqueadoPorSuscripcion",
                table: "Gym",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "FechaAccesoHastaUtc",
                table: "Gym",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "FechaBloqueoSuscripcionUtc",
                table: "Gym",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PayPalPlanId",
                table: "Gym",
                type: "varchar(50)",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "GymPayPalSubscriptionHistorial",
                columns: table => new
                {
                    IdHistorial = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    IdGym = table.Column<int>(type: "int", nullable: false),
                    PayPalSubscriptionId = table.Column<string>(type: "varchar(50)", nullable: false),
                    PayPalPlanId = table.Column<string>(type: "varchar(50)", nullable: true),
                    EstadoPayPal = table.Column<string>(type: "varchar(24)", nullable: true),
                    FechaInicioUtc = table.Column<DateTime>(type: "datetime2", nullable: true),
                    FechaFinAccesoUtc = table.Column<DateTime>(type: "datetime2", nullable: true),
                    FechaReemplazoUtc = table.Column<DateTime>(type: "datetime2", nullable: true),
                    Motivo = table.Column<string>(type: "varchar(60)", nullable: false),
                    FechaRegistroUtc = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GymPayPalSubscriptionHistorial", x => x.IdHistorial);
                    table.ForeignKey(
                        name: "FK_GymPayPalSubscriptionHistorial_Gym_IdGym",
                        column: x => x.IdGym,
                        principalTable: "Gym",
                        principalColumn: "IdGym",
                        onDelete: ReferentialAction.NoAction);
                });

            migrationBuilder.CreateIndex(
                name: "IX_GymPayPalSubscriptionHistorial_IdGym",
                table: "GymPayPalSubscriptionHistorial",
                column: "IdGym");

            migrationBuilder.CreateIndex(
                name: "IX_GymPayPalSubscriptionHistorial_PayPalSubscriptionId",
                table: "GymPayPalSubscriptionHistorial",
                column: "PayPalSubscriptionId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "GymPayPalSubscriptionHistorial");

            migrationBuilder.DropColumn(
                name: "AccesoBloqueadoPorSuscripcion",
                table: "Gym");

            migrationBuilder.DropColumn(
                name: "FechaAccesoHastaUtc",
                table: "Gym");

            migrationBuilder.DropColumn(
                name: "FechaBloqueoSuscripcionUtc",
                table: "Gym");

            migrationBuilder.DropColumn(
                name: "PayPalPlanId",
                table: "Gym");
        }
    }
}
