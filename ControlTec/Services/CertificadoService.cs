using System;
using System.IO;
using System.Threading.Tasks;
using ControlTec.Data;
using Microsoft.AspNetCore.Hosting;
using Microsoft.EntityFrameworkCore;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace ControlTec.Services
{
    public class CertificadoService : ICertificadoService
    {
        private readonly AppDbContext _context;
        private readonly IWebHostEnvironment _env;

        public CertificadoService(AppDbContext context, IWebHostEnvironment env)
        {
            _context = context;
            _env = env;
            QuestPDF.Settings.License = LicenseType.Community;
        }

        public async Task<string> GenerarCertificadoAsync(int solicitudId)
        {
            var solicitud = await _context.Solicitudes
                .Include(s => s.Usuario)
                .Include(s => s.Servicio)
                .FirstOrDefaultAsync(s => s.Id == solicitudId);

            if (solicitud == null)
                throw new Exception("Solicitud no encontrada para generar certificado.");

            if (solicitud.Usuario == null || solicitud.Servicio == null)
                throw new Exception("Datos incompletos para generar certificado.");

            var webRoot = _env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
            var carpetaCertificados = Path.Combine(webRoot, "uploads", "certificados", solicitudId.ToString());

            if (!Directory.Exists(carpetaCertificados))
                Directory.CreateDirectory(carpetaCertificados);

            var nombreArchivo = $"Certificado_{solicitudId}.pdf";
            var rutaFisica = Path.Combine(carpetaCertificados, nombreArchivo);
            var rutaRelativa = $"/uploads/certificados/{solicitudId}/{nombreArchivo}";

            var fechaHoy = DateTime.Now;

            var logoPath = Path.Combine(webRoot, "img", "logo_sns.png");

            var doc = Document.Create(container =>
            {
                container.Page(page =>
                {
                    page.Size(PageSizes.A4);
                    page.Margin(40);
                    page.PageColor(Colors.White);
                    page.DefaultTextStyle(x => x.FontFamily("Arial").FontSize(12));

                    page.Header().Row(row =>
                    {
                        row.RelativeItem().AlignCenter().Height(90).Image(logoPath, ImageScaling.FitArea);
                    });

                    page.Content().Column(col =>
                    {
                        col.Spacing(12);

                        col.Item().Text("MINISTERIO DE SALUD PÚBLICA")
                            .FontSize(16).SemiBold().AlignCenter();

                        col.Item().Text("UNIDAD DE PRODUCTOS CONTROLADOS (UPC)")
                            .FontSize(14).AlignCenter();

                        col.Item().Text($"Certificado de {solicitud.Servicio.Nombre}")
                            .FontSize(14).SemiBold().AlignCenter();

                        col.Item().LineHorizontal(1).LineColor(Colors.Grey.Lighten2);

                        col.Item().Text($"No. de solicitud: {solicitud.Id}").Bold();
                        col.Item().Text($"Fecha de emisión: {fechaHoy:dd/MM/yyyy}");
                        col.Item().Text($"Nombre del solicitante: {solicitud.Usuario.Nombre}");
                        col.Item().Text($"Cédula/RNC: {solicitud.Usuario.Cedula}");
                        col.Item().Text($"Correo de contacto: {solicitud.Usuario.Correo}");
                        col.Item().Text($"Servicio: {solicitud.Servicio.Nombre}");
                        col.Item().Text($"Descripción: {solicitud.Servicio.Descripcion}");

                        col.Item().PaddingVertical(10).Text(
                            "Por medio del presente documento se certifica que la solicitud indicada ha cumplido con los requisitos establecidos por la Unidad de Productos Controlados, y se autoriza la emisión del certificado correspondiente."
                        ).Italic();

                        col.Item().PaddingTop(40).AlignCenter().Text("______________________________");
                        col.Item().AlignCenter().Text("Dirección de Productos Controlados");
                    });
                });
            });

            doc.GeneratePdf(rutaFisica);

            solicitud.RutaCertificado = rutaRelativa;
            await _context.SaveChangesAsync();

            return rutaRelativa;
        }
    }
}