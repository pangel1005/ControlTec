using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ControlTec.Migrations
{
    /// <inheritdoc />
    public partial class AddMissingEmailConfirmationColumns : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_RespuestaFormularioDigital_FormularioDigital_FormularioDigitalId",
                table: "RespuestaFormularioDigital");

            migrationBuilder.DropForeignKey(
                name: "FK_RespuestaFormularioDigital_Solicitudes_SolicitudId",
                table: "RespuestaFormularioDigital");

            migrationBuilder.AddColumn<DateTime>(
                name: "EmailConfirmacionExpira",
                table: "Usuarios",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "EmailConfirmacionToken",
                table: "Usuarios",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "EmailConfirmado",
                table: "Usuarios",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "FechaEmailConfirmado",
                table: "Usuarios",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddForeignKey(
                name: "FK_RespuestaFormularioDigital_FormularioDigital_FormularioDigitalId",
                table: "RespuestaFormularioDigital",
                column: "FormularioDigitalId",
                principalTable: "FormularioDigital",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_RespuestaFormularioDigital_Solicitudes_SolicitudId",
                table: "RespuestaFormularioDigital",
                column: "SolicitudId",
                principalTable: "Solicitudes",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_RespuestaFormularioDigital_FormularioDigital_FormularioDigitalId",
                table: "RespuestaFormularioDigital");

            migrationBuilder.DropForeignKey(
                name: "FK_RespuestaFormularioDigital_Solicitudes_SolicitudId",
                table: "RespuestaFormularioDigital");

            migrationBuilder.DropColumn(
                name: "EmailConfirmacionExpira",
                table: "Usuarios");

            migrationBuilder.DropColumn(
                name: "EmailConfirmacionToken",
                table: "Usuarios");

            migrationBuilder.DropColumn(
                name: "EmailConfirmado",
                table: "Usuarios");

            migrationBuilder.DropColumn(
                name: "FechaEmailConfirmado",
                table: "Usuarios");

            migrationBuilder.AddForeignKey(
                name: "FK_RespuestaFormularioDigital_FormularioDigital_FormularioDigitalId",
                table: "RespuestaFormularioDigital",
                column: "FormularioDigitalId",
                principalTable: "FormularioDigital",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_RespuestaFormularioDigital_Solicitudes_SolicitudId",
                table: "RespuestaFormularioDigital",
                column: "SolicitudId",
                principalTable: "Solicitudes",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
