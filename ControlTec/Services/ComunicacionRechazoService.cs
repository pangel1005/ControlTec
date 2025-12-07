using System;
using System.IO;
using System.Threading.Tasks;
using ControlTec.Data;
using Microsoft.AspNetCore.Hosting;
using Microsoft.EntityFrameworkCore;

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
            // Traer datos básicos de la solicitud para llenar la comunicación
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

            // 🔹 POR AHORA: placeholder sencillo.
            // Luego puedes reemplazar esto por una generación real de PDF (iText7, QuestPDF, etc).
            var contenido = $@"
COMUNICACIÓN DE RECHAZO

Fecha: {DateTime.Now:dd/MM/yyyy}

Solicitante: {solicitud.Usuario?.Nombre} ({solicitud.Usuario?.Correo})
Servicio: {solicitud.Servicio?.Nombre}
No. de solicitud: {solicitud.Id}

Por medio de la presente se comunica que la solicitud ha sido RECHAZADA 
según los criterios de evaluación técnica establecidos por DIGEAMPS.

Atentamente,

Dirección.
";

            // Escribimos texto dentro de un .pdf (sigue siendo un archivo, aunque no tenga formato),
            // para que al menos tengas la ruta y puedas cambiar luego la lógica a una lib de PDF.
            await File.WriteAllTextAsync(filePath, contenido);

            // Ruta relativa para consumir desde el front
            var rutaRelativa = $"/rechazos/{fileName}";
            return rutaRelativa;
        }
    }
}
