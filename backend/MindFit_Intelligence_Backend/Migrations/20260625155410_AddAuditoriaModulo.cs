using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MindFit_Intelligence_Backend.Migrations
{
    /// <inheritdoc />
    public partial class AddAuditoriaModulo : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Accion",
                table: "RutinaHistorial",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CambiosJson",
                table: "RutinaHistorial",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "FechaAccionUtc",
                table: "RutinaHistorial",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "IdUsuarioAccion",
                table: "RutinaHistorial",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ValoresNuevosJson",
                table: "RutinaHistorial",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "AuditoriaEvento",
                columns: table => new
                {
                    IdAuditoriaEvento = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    FechaHoraUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
                    IdUsuario = table.Column<int>(type: "int", nullable: true),
                    Username = table.Column<string>(type: "varchar(80)", nullable: true),
                    IdGimnasio = table.Column<int>(type: "int", nullable: true),
                    Entidad = table.Column<string>(type: "varchar(80)", nullable: false),
                    IdEntidad = table.Column<int>(type: "int", nullable: true),
                    Accion = table.Column<string>(type: "varchar(80)", nullable: false),
                    Endpoint = table.Column<string>(type: "varchar(200)", nullable: true),
                    MetodoHttp = table.Column<string>(type: "varchar(12)", nullable: true),
                    IpAddress = table.Column<string>(type: "varchar(64)", nullable: true),
                    UserAgent = table.Column<string>(type: "varchar(512)", nullable: true),
                    ValoresOriginalesJson = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ValoresNuevosJson = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CambiosJson = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Resultado = table.Column<string>(type: "varchar(40)", nullable: false),
                    Mensaje = table.Column<string>(type: "varchar(400)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AuditoriaEvento", x => x.IdAuditoriaEvento);
                });

            migrationBuilder.CreateTable(
                name: "AuditoriaSesion",
                columns: table => new
                {
                    IdAuditoriaSesion = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    FechaHoraUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
                    IdUsuario = table.Column<int>(type: "int", nullable: true),
                    UsernameIntentado = table.Column<string>(type: "varchar(80)", nullable: true),
                    IdGimnasio = table.Column<int>(type: "int", nullable: true),
                    TipoEvento = table.Column<string>(type: "varchar(40)", nullable: false),
                    Resultado = table.Column<string>(type: "varchar(40)", nullable: false),
                    IpAddress = table.Column<string>(type: "varchar(64)", nullable: true),
                    UserAgent = table.Column<string>(type: "varchar(512)", nullable: true),
                    MotivoFallo = table.Column<string>(type: "varchar(200)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AuditoriaSesion", x => x.IdAuditoriaSesion);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AuditoriaEvento_Entidad_IdEntidad",
                table: "AuditoriaEvento",
                columns: new[] { "Entidad", "IdEntidad" });

            migrationBuilder.CreateIndex(
                name: "IX_AuditoriaEvento_FechaHoraUtc",
                table: "AuditoriaEvento",
                column: "FechaHoraUtc");

            migrationBuilder.CreateIndex(
                name: "IX_AuditoriaEvento_IdGimnasio_FechaHoraUtc",
                table: "AuditoriaEvento",
                columns: new[] { "IdGimnasio", "FechaHoraUtc" });

            migrationBuilder.CreateIndex(
                name: "IX_AuditoriaEvento_IdUsuario_FechaHoraUtc",
                table: "AuditoriaEvento",
                columns: new[] { "IdUsuario", "FechaHoraUtc" });

            migrationBuilder.CreateIndex(
                name: "IX_AuditoriaSesion_FechaHoraUtc",
                table: "AuditoriaSesion",
                column: "FechaHoraUtc");

            migrationBuilder.CreateIndex(
                name: "IX_AuditoriaSesion_IdGimnasio_FechaHoraUtc",
                table: "AuditoriaSesion",
                columns: new[] { "IdGimnasio", "FechaHoraUtc" });

            migrationBuilder.CreateIndex(
                name: "IX_AuditoriaSesion_IdUsuario_FechaHoraUtc",
                table: "AuditoriaSesion",
                columns: new[] { "IdUsuario", "FechaHoraUtc" });

            migrationBuilder.Sql("""
                IF NOT EXISTS (SELECT 1 FROM [Permiso] WHERE [Codigo] = 'VER_AUDITORIA')
                BEGIN
                    INSERT INTO [Permiso] ([Codigo], [Descripcion])
                    VALUES ('VER_AUDITORIA', 'Permite consultar trazabilidad, sesiones y reportes de auditoria')
                END

                IF NOT EXISTS (SELECT 1 FROM [Formulario] WHERE [NombreFormulario] = 'FORMULARIO_AUDITORIA')
                BEGIN
                    INSERT INTO [Formulario] ([NombreFormulario])
                    VALUES ('FORMULARIO_AUDITORIA')
                END

                DECLARE @IdPermisoAuditoria int = (
                    SELECT TOP 1 [IdPermiso] FROM [Permiso] WHERE [Codigo] = 'VER_AUDITORIA'
                )
                DECLARE @IdGrupoAdmin int = (
                    SELECT TOP 1 [IdGrupo] FROM [Grupo] WHERE [Nombre] = 'Admin'
                )
                DECLARE @IdFormularioAuditoria int = (
                    SELECT TOP 1 [IdFormulario] FROM [Formulario] WHERE [NombreFormulario] = 'FORMULARIO_AUDITORIA'
                )

                IF @IdPermisoAuditoria IS NOT NULL
                   AND @IdGrupoAdmin IS NOT NULL
                   AND NOT EXISTS (
                        SELECT 1 FROM [GrupoPermiso]
                        WHERE [IdGrupo] = @IdGrupoAdmin AND [IdPermiso] = @IdPermisoAuditoria
                   )
                BEGIN
                    INSERT INTO [GrupoPermiso] ([IdGrupo], [IdPermiso])
                    VALUES (@IdGrupoAdmin, @IdPermisoAuditoria)
                END

                IF @IdPermisoAuditoria IS NOT NULL
                   AND @IdFormularioAuditoria IS NOT NULL
                   AND NOT EXISTS (
                        SELECT 1 FROM [FormularioPermiso]
                        WHERE [IdFormulario] = @IdFormularioAuditoria AND [IdPermiso] = @IdPermisoAuditoria
                   )
                BEGIN
                    INSERT INTO [FormularioPermiso] ([IdFormulario], [IdPermiso])
                    VALUES (@IdFormularioAuditoria, @IdPermisoAuditoria)
                END
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                DECLARE @IdPermisoAuditoria int = (
                    SELECT TOP 1 [IdPermiso] FROM [Permiso] WHERE [Codigo] = 'VER_AUDITORIA'
                )
                DECLARE @IdFormularioAuditoria int = (
                    SELECT TOP 1 [IdFormulario] FROM [Formulario] WHERE [NombreFormulario] = 'FORMULARIO_AUDITORIA'
                )

                IF @IdPermisoAuditoria IS NOT NULL
                BEGIN
                    DELETE FROM [GrupoPermiso] WHERE [IdPermiso] = @IdPermisoAuditoria
                    DELETE FROM [FormularioPermiso] WHERE [IdPermiso] = @IdPermisoAuditoria
                    DELETE FROM [Permiso] WHERE [IdPermiso] = @IdPermisoAuditoria
                END

                IF @IdFormularioAuditoria IS NOT NULL
                   AND NOT EXISTS (
                        SELECT 1 FROM [FormularioPermiso]
                        WHERE [IdFormulario] = @IdFormularioAuditoria
                   )
                BEGIN
                    DELETE FROM [Formulario] WHERE [IdFormulario] = @IdFormularioAuditoria
                END
                """);

            migrationBuilder.DropTable(
                name: "AuditoriaEvento");

            migrationBuilder.DropTable(
                name: "AuditoriaSesion");

            migrationBuilder.DropColumn(
                name: "Accion",
                table: "RutinaHistorial");

            migrationBuilder.DropColumn(
                name: "CambiosJson",
                table: "RutinaHistorial");

            migrationBuilder.DropColumn(
                name: "FechaAccionUtc",
                table: "RutinaHistorial");

            migrationBuilder.DropColumn(
                name: "IdUsuarioAccion",
                table: "RutinaHistorial");

            migrationBuilder.DropColumn(
                name: "ValoresNuevosJson",
                table: "RutinaHistorial");
        }
    }
}
