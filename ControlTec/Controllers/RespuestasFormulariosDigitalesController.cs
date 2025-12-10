using ControlTec.Data;
using ControlTec.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;

namespace ControlTec.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class RespuestasFormulariosDigitalesController : ControllerBase
    {
        private readonly AppDbContext _context;
        public RespuestasFormulariosDigitalesController(AppDbContext context)
        {
            _context = context;
        }

        // POST: api/RespuestasFormulariosDigitales
        [HttpPost]
        public async Task<ActionResult<RespuestaFormularioDigital>> PostRespuesta(RespuestaFormularioDigital respuesta)
        {
            _context.RespuestasFormulariosDigitales.Add(respuesta);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetRespuestaPorSolicitud), new { solicitudId = respuesta.SolicitudId }, respuesta);
        }

        // GET: api/RespuestasFormulariosDigitales/solicitud/5
        [Authorize(Roles = "VUS,TecnicoUPC,EncargadoUPC,DNCD,Direccion,Admin")]
        [HttpGet("solicitud/{solicitudId}")]
        public async Task<ActionResult<RespuestaFormularioDigital?>> GetRespuestaPorSolicitud(int solicitudId)
        {
            var resp = await _context.RespuestasFormulariosDigitales
                .FirstOrDefaultAsync(r => r.SolicitudId == solicitudId);
            if (resp == null)
                return NotFound();
            return resp;
        }
    }
}