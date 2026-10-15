using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MindFit_Intelligence_Backend.Migrations
{
    /// <inheritdoc />
    public partial class InitDB : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Usuario",
                columns: table => new
                {
                    IdUsuario = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    FechaRegistro = table.Column<DateTime>(type: "date", nullable: false),
                    Username = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    PasswordHash = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Rol = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    RefreshToken = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    RefreshTokenExpiryTime = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Usuario", x => x.IdUsuario);
                });

            migrationBuilder.CreateTable(
                name: "PersonaResponsable",
                columns: table => new
                {
                    IdUsuario = table.Column<int>(type: "int", nullable: false),
                    Nombre = table.Column<string>(type: "varchar(50)", nullable: false),
                    Apellido = table.Column<string>(type: "varchar(50)", nullable: false),
                    Email = table.Column<string>(type: "varchar(50)", nullable: false),
                    Telefono = table.Column<string>(type: "varchar(20)", nullable: true),
                    Direccion = table.Column<string>(type: "varchar(50)", nullable: true),
                    Ciudad = table.Column<string>(type: "varchar(50)", nullable: true),
                    TipoDocumento = table.Column<string>(type: "varchar(50)", nullable: false),
                    NroDocumento = table.Column<string>(type: "varchar(20)", nullable: false),
                    Genero = table.Column<int>(type: "int", nullable: true),
                    FechaNacimiento = table.Column<DateTime>(type: "date", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PersonaResponsable", x => x.IdUsuario);
                    table.ForeignKey(
                        name: "FK_PersonaResponsable_Usuario_IdUsuario",
                        column: x => x.IdUsuario,
                        principalTable: "Usuario",
                        principalColumn: "IdUsuario",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "PersonaSocio",
                columns: table => new
                {
                    IdUsuario = table.Column<int>(type: "int", nullable: false),
                    Nombre = table.Column<string>(type: "varchar(50)", nullable: false),
                    Apellido = table.Column<string>(type: "varchar(50)", nullable: false),
                    Email = table.Column<string>(type: "varchar(50)", nullable: false),
                    Telefono = table.Column<string>(type: "varchar(20)", nullable: true),
                    Direccion = table.Column<string>(type: "varchar(50)", nullable: true),
                    Ciudad = table.Column<string>(type: "varchar(50)", nullable: true),
                    TipoDocumento = table.Column<string>(type: "varchar(50)", nullable: false),
                    NroDocumento = table.Column<string>(type: "varchar(20)", nullable: false),
                    Genero = table.Column<int>(type: "int", nullable: true),
                    FechaNacimiento = table.Column<DateTime>(type: "date", nullable: true),
                    ObraSocial = table.Column<string>(type: "varchar(50)", nullable: true),
                    Plan = table.Column<string>(type: "varchar(50)", nullable: true),
                    EstadoSocio = table.Column<string>(type: "varchar(50)", nullable: true),
                    FechaInicioActividades = table.Column<DateTime>(type: "date", nullable: true),
                    FechaFinActividades = table.Column<DateTime>(type: "date", nullable: true),
                    FechaNotificacion = table.Column<DateTime>(type: "date", nullable: true),
                    RespuestaNotificacion = table.Column<bool>(type: "bit", nullable: true),
                    Pregunta = table.Column<string>(type: "varchar(100)", nullable: true),
                    Respuesta = table.Column<string>(type: "varchar(100)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PersonaSocio", x => x.IdUsuario);
                    table.ForeignKey(
                        name: "FK_PersonaSocio_Usuario_IdUsuario",
                        column: x => x.IdUsuario,
                        principalTable: "Usuario",
                        principalColumn: "IdUsuario",
                        onDelete: ReferentialAction.Cascade);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "PersonaResponsable");

            migrationBuilder.DropTable(
                name: "PersonaSocio");

            migrationBuilder.DropTable(
                name: "Usuario");
        }
    }
}
