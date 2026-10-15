using System;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using MindFit_Intelligence_Backend.Models.Master;

#nullable disable

namespace MindFit_Intelligence_Backend.Migrations.Master
{
    /// <inheritdoc />
    [DbContext(typeof(MindFitMasterContext))]
    [Migration("20260710203000_AddPayPalSubscriptionToGym")]
    public partial class AddPayPalSubscriptionToGym : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "PayPalSubscriptionId",
                table: "Gym",
                type: "varchar(50)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "EstadoSuscripcionPayPal",
                table: "Gym",
                type: "varchar(24)",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "FechaProximoPagoUtc",
                table: "Gym",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "FechaEstadoSuscripcionUtc",
                table: "Gym",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "FechaUltimaVerificacionPayPalUtc",
                table: "Gym",
                type: "datetime2",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Gym_PayPalSubscriptionId",
                table: "Gym",
                column: "PayPalSubscriptionId",
                unique: true,
                filter: "[PayPalSubscriptionId] IS NOT NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Gym_PayPalSubscriptionId",
                table: "Gym");

            migrationBuilder.DropColumn(
                name: "PayPalSubscriptionId",
                table: "Gym");

            migrationBuilder.DropColumn(
                name: "EstadoSuscripcionPayPal",
                table: "Gym");

            migrationBuilder.DropColumn(
                name: "FechaProximoPagoUtc",
                table: "Gym");

            migrationBuilder.DropColumn(
                name: "FechaEstadoSuscripcionUtc",
                table: "Gym");

            migrationBuilder.DropColumn(
                name: "FechaUltimaVerificacionPayPalUtc",
                table: "Gym");
        }
    }
}
