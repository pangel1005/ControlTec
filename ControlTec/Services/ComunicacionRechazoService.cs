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
    public class ComunicacionRechazoService : IComunicacionRechazoService
    {
        private readonly AppDbContext _context;
        private readonly IWebHostEnvironment _env;

        public ComunicacionRechazoService(AppDbContext context, IWebHostEnvironment env)
        {
            _context = context;
            _env = env;
        }

        public async Task<string> GenerarComunicacionRechazoAsync(int solicitudId)
        {
            var solicitud = await _context.Solicitudes
                .Include(s => s.Usuario)
                .Include(s => s.Servicio)
                .FirstOrDefaultAsync(s => s.Id == solicitudId);

            if (solicitud == null)
                throw new Exception($"No existe la solicitud con Id {solicitudId}.");

            var webRoot = _env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
            var carpeta = Path.Combine(webRoot, "rechazos");

            if (!Directory.Exists(carpeta))
                Directory.CreateDirectory(carpeta);

            var fileName = $"rechazo_{solicitudId}_{DateTime.Now:yyyyMMddHHmmss}.pdf";
            var filePath = Path.Combine(carpeta, fileName);

            var logoPath = Path.Combine(webRoot, "img", "logo_sns.png");
            var fecha = DateTime.Now.ToString("dd/MM/yyyy");

            Document.Create(container =>
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

                        col.Item().Text("COMUNICACIÓN DE RECHAZO")
                            .FontSize(18).SemiBold().AlignCenter();

                        col.Item().Text($"Fecha: {fecha}").AlignRight();
                        col.Item().LineHorizontal(1).LineColor(Colors.Grey.Lighten2);

                        col.Item().Text($"Solicitante: {solicitud.Usuario?.Nombre} ({solicitud.Usuario?.Correo})");
                        col.Item().Text($"Servicio: {solicitud.Servicio?.Nombre}");
                        col.Item().Text($"No. de solicitud: {solicitud.Id}");

                        col.Item().PaddingVertical(10).Text(
                            "Por medio de la presente se comunica que la solicitud ha sido RECHAZADA según los criterios de evaluación técnica establecidos por DIGEAMPS."
                        ).Italic();

                        col.Item().PaddingTop(40).AlignCenter().Text("Atentamente,");
                        col.Item().AlignCenter().Text("Dirección.");
                    });
                });
            }).GeneratePdf(filePath);

            var rutaRelativa = $"/rechazos/{fileName}";
            return rutaRelativa;
        }
    }
}