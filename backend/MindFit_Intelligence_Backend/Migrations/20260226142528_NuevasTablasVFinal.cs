using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MindFit_Intelligence_Backend.Migrations
{
    /// <inheritdoc />
    public partial class NuevasTablasVFinal : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_UsuarioGrupo_Grupo_IdGrupo",
                table: "UsuarioGrupo");

            // --- 1. RESCATE DE PLAN (Llenamos nulos ANTES de alterar la columna) ---
            migrationBuilder.Sql("UPDATE [PersonaSocio] SET [Plan] = 'Mensual' WHERE [Plan] IS NULL;");

            migrationBuilder.AlterColumn<string>(
                name: "Plan",
                table: "PersonaSocio",
                type: "varchar(50)",
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "varchar(50)",
                oldNullable: true);

            // --- 2. EL ALTER DE GENERO EN PERSONASOCIO (Pasa de int a texto: '1', '2', etc.) ---
            migrationBuilder.AlterColumn<string>(
                name: "Genero",
                table: "PersonaSocio",
                type: "varchar(20)",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "int",
                oldNullable: true);

            // --- 3. TRADUCCIÓN DE NÚMEROS A TEXTO EN PERSONASOCIO ---
            migrationBuilder.Sql("UPDATE [PersonaSocio] SET [Genero] = 'Masculino' WHERE [Genero] = '1';");
            migrationBuilder.Sql("UPDATE [PersonaSocio] SET [Genero] = 'Femenino' WHERE [Genero] = '2';");
            migrationBuilder.Sql("UPDATE [PersonaSocio] SET [Genero] = 'Otro' WHERE [Genero] = '3';");
            migrationBuilder.Sql("UPDATE [PersonaSocio] SET [Genero] = 'NoEspecifica' WHERE [Genero] = '4';");

            // --- 4. RESCATE DE ESTADOSOCIO (Llenamos nulos ANTES de alterar la columna) ---
            migrationBuilder.Sql("UPDATE [PersonaSocio] SET [EstadoSocio] = 'Nuevo' WHERE [EstadoSocio] IS NULL;");

            migrationBuilder.AlterColumn<string>(
                name: "EstadoSocio",
                table: "PersonaSocio",
                type: "varchar(50)",
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "varchar(50)",
                oldNullable: true);

            // --- 5. EL ALTER DE GENERO EN PERSONARESPONSABLE ---
            migrationBuilder.AlterColumn<string>(
                name: "Genero",
                table: "PersonaResponsable",
                type: "varchar(20)",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "int",
                oldNullable: true);

            // --- 6. TRADUCCIÓN DE NÚMEROS A TEXTO EN PERSONARESPONSABLE ---
            migrationBuilder.Sql("UPDATE [PersonaResponsable] SET [Genero] = 'Masculino' WHERE [Genero] = '1';");
            migrationBuilder.Sql("UPDATE [PersonaResponsable] SET [Genero] = 'Femenino' WHERE [Genero] = '2';");
            migrationBuilder.Sql("UPDATE [PersonaResponsable] SET [Genero] = 'Otro' WHERE [Genero] = '3';");
            migrationBuilder.Sql("UPDATE [PersonaResponsable] SET [Genero] = 'NoEspecifica' WHERE [Genero] = '4';");

            migrationBuilder.CreateTable(
                name: "Dia",
                columns: table => new
                {
                    IdDia = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    NombreDia = table.Column<string>(type: "varchar(25)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Dia", x => x.IdDia);
                });

            migrationBuilder.CreateTable(
                name: "Rutina",
                columns: table => new
                {
                    IdRutina = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    FechaModificacion = table.Column<DateTime>(type: "datetime2", nullable: false),
                    IdPersonaSocio = table.Column<int>(type: "int", nullable: false),
                    IdDia = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Rutina", x => x.IdRutina);
                    table.ForeignKey(
                        name: "FK_Rutina_Dia_IdDia",
                        column: x => x.IdDia,
                        principalTable: "Dia",
                        principalColumn: "IdDia",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Rutina_PersonaSocio_IdPersonaSocio",
                        column: x => x.IdPersonaSocio,
                        principalTable: "PersonaSocio",
                        principalColumn: "IdUsuario",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Dia_NombreDia",
                table: "Dia",
                column: "NombreDia",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Rutina_IdDia",
                table: "Rutina",
                column: "IdDia");

            migrationBuilder.CreateIndex(
                name: "IX_Rutina_IdPersonaSocio",
                table: "Rutina",
                column: "IdPersonaSocio");

            migrationBuilder.AddForeignKey(
                name: "FK_UsuarioGrupo_Grupo_IdGrupo",
                table: "UsuarioGrupo",
                column: "IdGrupo",
                principalTable: "Grupo",
                principalColumn: "IdGrupo",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_UsuarioGrupo_Grupo_IdGrupo",
                table: "UsuarioGrupo");

            migrationBuilder.DropTable(
                name: "Rutina");

            migrationBuilder.DropTable(
                name: "Dia");

            migrationBuilder.AlterColumn<string>(
                name: "Plan",
                table: "PersonaSocio",
                type: "varchar(50)",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "varchar(50)");

            migrationBuilder.AlterColumn<int>(
                name: "Genero",
                table: "PersonaSocio",
                type: "int",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "varchar(20)",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "EstadoSocio",
                table: "PersonaSocio",
                type: "varchar(50)",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "varchar(50)");

            migrationBuilder.AlterColumn<int>(
                name: "Genero",
                table: "PersonaResponsable",
                type: "int",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "varchar(20)",
                oldNullable: true);

            migrationBuilder.AddForeignKey(
                name: "FK_UsuarioGrupo_Grupo_IdGrupo",
                table: "UsuarioGrupo",
                column: "IdGrupo",
                principalTable: "Grupo",
                principalColumn: "IdGrupo",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
