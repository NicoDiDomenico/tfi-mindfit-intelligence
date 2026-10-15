using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Configuration;
using MimeKit;
using MindFit_Intelligence_Backend.Services.Interfaces;

namespace MindFit_Intelligence_Backend.Services
{
    public class SmtpEmailService : IEmailService
    {
        private readonly IConfiguration _configuration;

        public SmtpEmailService(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        public async Task SendAsync(string toEmail, string subject, string htmlBody)
        {
            var host = _configuration["Smtp:Host"]!;
            var port = int.Parse(_configuration["Smtp:Port"]!);
            var useSsl = bool.Parse(_configuration["Smtp:UseSsl"]!);

            // username y password los tendria que sacar de la bd del gym o podria ser un usuario global para todos los gyms.
            var username = _configuration["Smtp:Username"]!;
            var password = _configuration["Smtp:Password"]!;

            var fromEmail = _configuration["Smtp:FromEmail"]!;
            var fromName = _configuration["Smtp:FromName"]!;

            var message = new MimeMessage();
            message.From.Add(new MailboxAddress(fromName, fromEmail));
            message.To.Add(MailboxAddress.Parse(toEmail));
            message.Subject = subject;

            message.Body = new BodyBuilder
            {
                HtmlBody = htmlBody
            }.ToMessageBody();

            using var client = new SmtpClient();

            var secureOption = port switch
            {
                465 => SecureSocketOptions.SslOnConnect,
                587 => SecureSocketOptions.StartTls,
                _ => useSsl ? SecureSocketOptions.SslOnConnect : SecureSocketOptions.StartTlsWhenAvailable
            };

            await client.ConnectAsync(host, port, secureOption);
            await client.AuthenticateAsync(username, password);
            await client.SendAsync(message);
            await client.DisconnectAsync(true);
        }
    }
}
