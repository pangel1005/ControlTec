using System.Net;
using System.Net.Mail;
using System.Threading.Tasks;

namespace ControlTec.Services
{
    public interface IEmailService
    {
        Task SendConfirmationEmail(string to, string link);
    }

    public class EmailService : IEmailService
    {
        private readonly string _smtpServer;
        private readonly int _smtpPort;
        private readonly string _smtpUser;
        private readonly string _smtpPass;
        private readonly string _from;

        public EmailService(string smtpServer, int smtpPort, string smtpUser, string smtpPass, string from)
        {
            _smtpServer = smtpServer;
            _smtpPort = smtpPort;
            _smtpUser = smtpUser;
            _smtpPass = smtpPass;
            _from = from;
        }

        public async Task SendConfirmationEmail(string to, string link)
        {
            var message = new MailMessage(_from, to)
            {
                Subject = "Confirma tu cuenta",
                Body = $"Por favor haz clic en el siguiente enlace para confirmar tu cuenta: {link}",
                IsBodyHtml = false
            };
            using var client = new SmtpClient(_smtpServer, _smtpPort)
            {
                Credentials = new NetworkCredential(_smtpUser, _smtpPass),
                EnableSsl = true
            };
            await client.SendMailAsync(message);
        }
    }
}
