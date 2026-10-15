using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using MindFit_Intelligence_Backend.Models;

#nullable disable

namespace MindFit_Intelligence_Backend.Migrations
{
    [DbContext(typeof(MindFitIntelligenceContext))]
    [Migration("20260626120000_AddReportesGimnasioPermiso")]
    public partial class AddReportesGimnasioPermiso : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                IF NOT EXISTS (SELECT 1 FROM [Permiso] WHERE [Codigo] = 'VER_REPORTES_GIMNASIO')
                BEGIN
                    INSERT INTO [Permiso] ([Codigo], [Descripcion])
                    VALUES ('VER_REPORTES_GIMNASIO', 'Permite consultar reportes, indicadores y estadisticas del gimnasio')
                END

                IF NOT EXISTS (SELECT 1 FROM [Formulario] WHERE [NombreFormulario] = 'FORMULARIO_REPORTES_GIMNASIO')
                BEGIN
                    INSERT INTO [Formulario] ([NombreFormulario])
                    VALUES ('FORMULARIO_REPORTES_GIMNASIO')
                END

                DECLARE @IdPermisoReportes int = (
                    SELECT TOP 1 [IdPermiso] FROM [Permiso] WHERE [Codigo] = 'VER_REPORTES_GIMNASIO'
                )
                DECLARE @IdGrupoAdmin int = (
                    SELECT TOP 1 [IdGrupo] FROM [Grupo] WHERE [Nombre] = 'Admin'
                )
                DECLARE @IdFormularioReportes int = (
                    SELECT TOP 1 [IdFormulario] FROM [Formulario] WHERE [NombreFormulario] = 'FORMULARIO_REPORTES_GIMNASIO'
                )

                IF @IdPermisoReportes IS NOT NULL
                   AND @IdGrupoAdmin IS NOT NULL
                   AND NOT EXISTS (
                        SELECT 1 FROM [GrupoPermiso]
                        WHERE [IdGrupo] = @IdGrupoAdmin AND [IdPermiso] = @IdPermisoReportes
                   )
                BEGIN
                    INSERT INTO [GrupoPermiso] ([IdGrupo], [IdPermiso])
                    VALUES (@IdGrupoAdmin, @IdPermisoReportes)
                END

                IF @IdPermisoReportes IS NOT NULL
                   AND @IdFormularioReportes IS NOT NULL
                   AND NOT EXISTS (
                        SELECT 1 FROM [FormularioPermiso]
                        WHERE [IdFormulario] = @IdFormularioReportes AND [IdPermiso] = @IdPermisoReportes
                   )
                BEGIN
                    INSERT INTO [FormularioPermiso] ([IdFormulario], [IdPermiso])
                    VALUES (@IdFormularioReportes, @IdPermisoReportes)
                END
                """);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                DECLARE @IdPermisoReportes int = (
                    SELECT TOP 1 [IdPermiso] FROM [Permiso] WHERE [Codigo] = 'VER_REPORTES_GIMNASIO'
                )
                DECLARE @IdFormularioReportes int = (
                    SELECT TOP 1 [IdFormulario] FROM [Formulario] WHERE [NombreFormulario] = 'FORMULARIO_REPORTES_GIMNASIO'
                )

                IF @IdPermisoReportes IS NOT NULL
                BEGIN
                    DELETE FROM [GrupoPermiso] WHERE [IdPermiso] = @IdPermisoReportes
                    DELETE FROM [FormularioPermiso] WHERE [IdPermiso] = @IdPermisoReportes
                    DELETE FROM [Permiso] WHERE [IdPermiso] = @IdPermisoReportes
                END

                IF @IdFormularioReportes IS NOT NULL
                   AND NOT EXISTS (
                        SELECT 1 FROM [FormularioPermiso]
                        WHERE [IdFormulario] = @IdFormularioReportes
                   )
                BEGIN
                    DELETE FROM [Formulario] WHERE [IdFormulario] = @IdFormularioReportes
                END
                """);
        }
    }
}
