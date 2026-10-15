using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MindFit_Intelligence_Backend.Migrations.Master
{
    /// <inheritdoc />
    public partial class AgregadoUsuariosMaster : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "UsuarioMaster",
                columns: table => new
                {
                    IdUsuarioMaster = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    IdGym = table.Column<int>(type: "int", nullable: false),
                    FechaRegistro = table.Column<DateTime>(type: "date", nullable: false),
                    Username = table.Column<string>(type: "varchar(50)", nullable: false),
                    PasswordHash = table.Column<string>(type: "varchar(255)", nullable: false),
                    RefreshToken = table.Column<string>(type: "varchar(512)", nullable: true),
                    RefreshTokenExpiryTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    PasswordResetTokenHash = table.Column<string>(type: "varchar(64)", nullable: true),
                    PasswordResetTokenExpiryTime = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UsuarioMaster", x => x.IdUsuarioMaster);
                    table.ForeignKey(
                        name: "FK_UsuarioMaster_Gym_IdGym",
                        column: x => x.IdGym,
                        principalTable: "Gym",
                        principalColumn: "IdGym",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "PersonaResponsableMaster",
                columns: table => new
                {
                    IdUsuarioMaster = table.Column<int>(type: "int", nullable: false),
                    Nombre = table.Column<string>(type: "varchar(50)", nullable: false),
                    Apellido = table.Column<string>(type: "varchar(50)", nullable: false),
                    Email = table.Column<string>(type: "varchar(50)", nullable: false),
                    Telefono = table.Column<string>(type: "varchar(20)", nullable: true),
                    Direccion = table.Column<string>(type: "varchar(50)", nullable: true),
                    Ciudad = table.Column<string>(type: "varchar(50)", nullable: true),
                    TipoDocumento = table.Column<string>(type: "varchar(50)", nullable: false),
                    NroDocumento = table.Column<string>(type: "varchar(20)", nullable: false),
                    Genero = table.Column<string>(type: "varchar(20)", nullable: true),
                    FechaNacimiento = table.Column<DateTime>(type: "date", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PersonaResponsableMaster", x => x.IdUsuarioMaster);
                    table.ForeignKey(
                        name: "FK_PersonaResponsableMaster_UsuarioMaster_IdUsuarioMaster",
                        column: x => x.IdUsuarioMaster,
                        principalTable: "UsuarioMaster",
                        principalColumn: "IdUsuarioMaster",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_UsuarioMaster_IdGym",
                table: "UsuarioMaster",
                column: "IdGym");

            migrationBuilder.CreateIndex(
                name: "IX_UsuarioMaster_Username",
                table: "UsuarioMaster",
                column: "Username",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "PersonaResponsableMaster");

            migrationBuilder.DropTable(
                name: "UsuarioMaster");
        }
    }
}
