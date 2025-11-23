using Microsoft.AspNetCore.Mvc;

namespace ControlTec.Controllers.Ui
{
    // IMPORTANTE: este controller NO lleva [ApiController] ni [Route("api/...")]
    public class SolicitudesController : Controller
    {
        // GET: /Solicitudes
        [HttpGet]
        public IActionResult Index()
        {
            return View();   // Views/Solicitudes/Index.cshtml
        }

        // GET: /Solicitudes/Nueva
        [HttpGet]
        public IActionResult Nueva()
        {
            return View();   // Views/Solicitudes/Nueva.cshtml
        }

        // GET: /Solicitudes/Detalle/5
        [HttpGet]
        public IActionResult Detalle(int id)
        {
            ViewData["SolicitudId"] = id;
            return View();   // Views/Solicitudes/Detalle.cshtml
        }
    }
}
