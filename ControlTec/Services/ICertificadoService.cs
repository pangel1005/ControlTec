using System.Threading.Tasks;

namespace ControlTec.Services
{
    public interface ICertificadoService
    {
        /// <summary>
        /// Genera el PDF del certificado para la solicitud indicada
        /// y devuelve la ruta relativa donde se guardó.
        /// </summary>
        Task<string> GenerarCertificadoAsync(int solicitudId);
    }
}
