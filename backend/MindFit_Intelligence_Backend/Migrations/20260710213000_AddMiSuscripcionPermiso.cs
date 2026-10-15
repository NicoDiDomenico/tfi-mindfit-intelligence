using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using MindFit_Intelligence_Backend.Models;

#nullable disable

namespace MindFit_Intelligence_Backend.Migrations
{
    [DbContext(typeof(MindFitIntelligenceContext))]
    [Migration("20260710213000_AddMiSuscripcionPermiso")]
    public partial class AddMiSuscripcionPermiso : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                IF NOT EXISTS (SELECT 1 FROM [Permiso] WHERE [Codigo] = 'VER_MI_SUSCRIPCION')
                BEGIN
                    INSERT INTO [Permiso] ([Codigo], [Descripcion])
                    VALUES ('VER_MI_SUSCRIPCION', 'Permite consultar y actualizar el estado de la suscripcion PayPal del gimnasio')
                END

                IF NOT EXISTS (SELECT 1 FROM [Formulario] WHERE [NombreFormulario] = 'FORMULARIO_MI_SUSCRIPCION')
                BEGIN
                    INSERT INTO [Formulario] ([NombreFormulario])
                    VALUES ('FORMULARIO_MI_SUSCRIPCION')
                END

                DECLARE @IdPermisoMiSuscripcion int = (
                    SELECT TOP 1 [IdPermiso] FROM [Permiso] WHERE [Codigo] = 'VER_MI_SUSCRIPCION'
                )
                DECLARE @IdGrupoAdmin int = (
                    SELECT TOP 1 [IdGrupo] FROM [Grupo] WHERE [Nombre] = 'Admin'
                )
                DECLARE @IdFormularioMiSuscripcion int = (
                    SELECT TOP 1 [IdFormulario] FROM [Formulario] WHERE [NombreFormulario] = 'FORMULARIO_MI_SUSCRIPCION'
                )

                IF @IdPermisoMiSuscripcion IS NOT NULL
                   AND @IdGrupoAdmin IS NOT NULL
                   AND NOT EXISTS (
                        SELECT 1 FROM [GrupoPermiso]
                        WHERE [IdGrupo] = @IdGrupoAdmin AND [IdPermiso] = @IdPermisoMiSuscripcion
                   )
                BEGIN
                    INSERT INTO [GrupoPermiso] ([IdGrupo], [IdPermiso])
                    VALUES (@IdGrupoAdmin, @IdPermisoMiSuscripcion)
                END

                IF @IdPermisoMiSuscripcion IS NOT NULL
                   AND @IdFormularioMiSuscripcion IS NOT NULL
                   AND NOT EXISTS (
                        SELECT 1 FROM [FormularioPermiso]
                        WHERE [IdFormulario] = @IdFormularioMiSuscripcion AND [IdPermiso] = @IdPermisoMiSuscripcion
                   )
                BEGIN
                    INSERT INTO [FormularioPermiso] ([IdFormulario], [IdPermiso])
                    VALUES (@IdFormularioMiSuscripcion, @IdPermisoMiSuscripcion)
                END
                """);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                DECLARE @IdPermisoMiSuscripcion int = (
                    SELECT TOP 1 [IdPermiso] FROM [Permiso] WHERE [Codigo] = 'VER_MI_SUSCRIPCION'
                )
                DECLARE @IdFormularioMiSuscripcion int = (
                    SELECT TOP 1 [IdFormulario] FROM [Formulario] WHERE [NombreFormulario] = 'FORMULARIO_MI_SUSCRIPCION'
                )

                IF @IdPermisoMiSuscripcion IS NOT NULL
                BEGIN
                    DELETE FROM [GrupoPermiso] WHERE [IdPermiso] = @IdPermisoMiSuscripcion
                    DELETE FROM [FormularioPermiso] WHERE [IdPermiso] = @IdPermisoMiSuscripcion
                    DELETE FROM [Permiso] WHERE [IdPermiso] = @IdPermisoMiSuscripcion
                END

                IF @IdFormularioMiSuscripcion IS NOT NULL
                   AND NOT EXISTS (
                        SELECT 1 FROM [FormularioPermiso]
                        WHERE [IdFormulario] = @IdFormularioMiSuscripcion
                   )
                BEGIN
                    DELETE FROM [Formulario] WHERE [IdFormulario] = @IdFormularioMiSuscripcion
                END
                """);
        }
    }
}
