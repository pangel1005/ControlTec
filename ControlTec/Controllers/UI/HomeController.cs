using Microsoft.AspNetCore.Mvc;

namespace ControlTec.Controllers.UI
{
    public class HomeController : Controller
    {
        public IActionResult Index()
        {
            return View();
        }
    }
}
