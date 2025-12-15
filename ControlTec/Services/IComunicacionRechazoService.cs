using System.Threading.Tasks;

namespace ControlTec.Services
{
    public interface IComunicacionRechazoService
    {
        /// <summary>
        /// Genera el PDF de Comunicación de Rechazo para la solicitud indicada
        /// y devuelve la ruta relativa del archivo (para guardarla/mostrarla).
        /// </summary>
        Task<string> GenerarComunicacionRechazoAsync(int solicitudId);
    }
}
