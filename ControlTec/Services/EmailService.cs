using System.Net;
using System.Net.Mail;
using Microsoft.Extensions.Configuration;

namespace ControlTec.Services
{
    public class EmailService
    {
        private readonly IConfiguration _config;

        public EmailService(IConfiguration config)
        {
            _config = config;
        }

        public async Task SendAsync(string to, string subject, string htmlBody)
        {
            var smtp = _config.GetSection("Smtp");

            var host = smtp["Host"];
            var user = smtp["User"];
            var pass = smtp["Password"];
            var fromAddress = smtp["FromAddress"];
            var fromName = smtp["FromName"];

            int port = int.Parse(smtp["Port"] ?? "587");
            bool enableSsl = bool.Parse(smtp["EnableSsl"] ?? "true");

            using var message = new MailMessage
            {
                From = new MailAddress(fromAddress!, fromName),
                Subject = subject,
                Body = htmlBody,
                IsBodyHtml = true
            };
            message.To.Add(to);

            using var client = new SmtpClient(host, port)
            {
                EnableSsl = enableSsl,
                Credentials = new NetworkCredential(user, pass)
            };

            await client.SendMailAsync(message);
        }
    }
}