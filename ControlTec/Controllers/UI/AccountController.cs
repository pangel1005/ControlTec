using Microsoft.AspNetCore.Mvc;

namespace ControlTec.Controllers.Ui
{
    public class AccountController : Controller
    {
        // GET: /Account/Login
        [HttpGet]
        public IActionResult Login()
        {
            return View();   // Renderiza Views/Account/Login.cshtml
        }

        // GET: /Account/Logout (opcional por ahora)
        [HttpGet]
        public IActionResult Logout()
        {
            // Aquí no borramos el token (eso se hace en el front),
            // solo redirigimos a la pantalla inicial.
            return RedirectToAction("Index", "Home");
        }
    }
}
