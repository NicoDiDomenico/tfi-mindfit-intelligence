using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MindFit_Intelligence_Backend.Migrations
{
    /// <inheritdoc />
    public partial class MoveUsuarioRolToGrupo : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // 1) Crear grupos a partir de roles existentes (sin duplicar)
            migrationBuilder.Sql(@"
                INSERT INTO Grupo (Nombre, Descripcion)
                SELECT DISTINCT u.Rol, 'Migrado desde Usuario.Rol'
                FROM Usuario u
                WHERE u.Rol IS NOT NULL AND LTRIM(RTRIM(u.Rol)) <> ''
                  AND NOT EXISTS (
                      SELECT 1 FROM Grupo g WHERE g.Nombre = u.Rol
                  );
            ");

                    // 2) Crear UsuarioGrupo para cada usuario según su rol
                    migrationBuilder.Sql(@"
                INSERT INTO UsuarioGrupo (IdUsuario, IdGrupo)
                SELECT u.IdUsuario, g.IdGrupo
                FROM Usuario u
                JOIN Grupo g ON g.Nombre = u.Rol
                WHERE u.Rol IS NOT NULL AND LTRIM(RTRIM(u.Rol)) <> ''
                  AND NOT EXISTS (
                      SELECT 1 FROM UsuarioGrupo ug
                      WHERE ug.IdUsuario = u.IdUsuario AND ug.IdGrupo = g.IdGrupo
                  );
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {

        }
    }
}
